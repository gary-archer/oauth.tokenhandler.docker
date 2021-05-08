import cookie, {CookieSerializeOptions} from 'cookie';
import {encryptCookie, decryptCookie} from 'cookie-encrypter';
import {Configuration} from '../configuration/configuration';
import {ErrorHandler} from '../errors/errorHandler';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';

/*
 * A class to deal with cookie sopecific responsibilities
 */
export class CookieService {

    private readonly _configuration: Configuration;
    private readonly _encryptionKey: Buffer;

    public constructor(configuration: Configuration) {
        this._encryptionKey = Buffer.from(configuration.api.cookieEncryptionKey, 'base64');
        this._configuration = configuration;
    }

    /*
     * Write a same site state cookie when a login starts
     */
    public writeStateCookie(data: any, response: AbstractResponse): void {

        const cookieName = this._getCookieName('state');
        const encryptedData = encryptCookie(JSON.stringify(data), {key: this._encryptionKey});
        response.addCookie(this._formatCookie(cookieName, encryptedData));
    }

    /*
     * Read the state cookie when a login ends
     */
    public readStateCookie(request: AbstractRequest): any {

        const cookieName = this._getCookieName('state');
        console.log(`Looking for cookie ${cookieName}`);
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {

            const serialized = this._decryptCookie(cookieName, encryptedData);
            return JSON.parse(serialized);
        }

        throw ErrorHandler.fromMissingCookieError('No state cookie was found in the incoming request');
    }

    /*
     * Write a same site auth cookie containing the refresh token
     */
    public writeAuthCookie(refreshToken: string, response: AbstractResponse): void {

        const cookieName = this._getCookieName('auth');
        const encryptedData = encryptCookie(refreshToken, {key: this._encryptionKey});
        response.addCookie(this._formatCookie(cookieName, encryptedData));
    }

    /*
     * Read the refresh token from the auth cookie
     */
    public readAuthCookie(request: AbstractRequest): string {

        const cookieName = this._getCookieName('auth');
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {
            return this._decryptCookie(cookieName, encryptedData);
        }

        throw ErrorHandler.fromMissingCookieError('No auth cookie was found in the incoming request');
    }

    /*
     * Write a same site cookie containing the id token, in case needed for logout
     */
    public writeIdCookie(idToken: string, response: AbstractResponse): void {

        const cookieName = this._getCookieName('id');
        const encryptedData = encryptCookie(idToken, {key: this._encryptionKey});
        response.addCookie(this._formatCookie(cookieName, encryptedData));
    }

    /*
     * Read the id cookie if needed for logout
     */
    public readIdCookie(request: AbstractRequest): void {

        const cookieName = this._getCookieName('id');
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {
            return this._decryptCookie(cookieName, encryptedData);
        }

        throw ErrorHandler.fromMissingCookieError('No id cookie was found in the incoming request');
    }

    /*
     * Write a cookie to make it harder for malicious code to post bogus forms to our token refresh endpoint
     */
    public writeAntiForgeryCookie(response: AbstractResponse, value: string): void {

        const cookieName = this._getCookieName('aft');
        const encryptedData = encryptCookie(value, {key: this._encryptionKey});
        response.addCookie(this._formatCookie(cookieName, encryptedData));
    }

    /*
     * We also derive the request header value from this class
     */
    public getAntiForgeryRequestHeaderName(): string {

        const cookieName = this._getCookieName('aft');
        return `x-${cookieName}`;
    }

    /*
     * Read the anti forgery value from the auth cookie
     */
    public readAntiForgeryCookie(request: AbstractRequest): string {

        const cookieName = this._getCookieName('aft');
        const encryptedData = request.getCookie(cookieName);
        if (!encryptedData) {
            throw ErrorHandler.fromMissingCookieError('No anti forgery cookie was found in the incoming request');
        }

        return this._decryptCookie(cookieName, encryptedData);
    }

    /*
     * Corrupt the refresh token inside the auth cookie by adding extra characters to it
     * This will cause an invalid_grant error when the refresh token is next sent to the Authorization Server
     */
    public expireAuthCookie(refreshToken: string, response: AbstractResponse): void {

        const expiredRefreshToken = `x${refreshToken}x`;
        this.writeAuthCookie(expiredRefreshToken, response);
    }

    /*
     * Clear all cookies when the user session expires
     */
    public clearAll(response: AbstractResponse): void {

        response.addCookie(this._clearCookie(`${this._getCookieName('auth')}`));
        response.addCookie(this._clearCookie(`${this._getCookieName('id')}`));
        response.addCookie(this._clearCookie(`${this._getCookieName('aft')}`));
    }

    /*
     * Return a cookie of the form 'mycompany-auth-finalspa'
     */
    private _getCookieName(type: string) {
        return `${this._configuration.api.cookiePrefix}-${type}-${this._configuration.client.name}`;
    }

    /*
     * Format a same site cookie for the web domain
     */
    private _formatCookie(cookieName: string, value: string): string {
        return cookie.serialize(cookieName, value, this._getCookieOptions());
    }

    /*
     * Clear a same site cookie
     */
    private _clearCookie(cookieName: string): string {

        const options = this._getCookieOptions();
        options.expires = new Date(0);
        return cookie.serialize(cookieName, '', options);
    }

    /*
     * A helper method to decrypt a cookie and report errors clearly
     */
    private _decryptCookie(cookieName: string, encryptedData: string) {

        try {
            return decryptCookie(encryptedData, {key: this._encryptionKey});

        } catch (e) {
            throw ErrorHandler.fromCookieDecryptionError(cookieName, e);
        }
    }

    /*
     * Both our auth cookie and anti forgery cookie use the same options
     */
    private _getCookieOptions(): CookieSerializeOptions {

        return {

            // The cookie cannot be read by Javascript code, but any logged in user can get the cookie via HTTP tools
            httpOnly: true,

            // The cookie can only be sent over an HTTPS connection
            secure: true,

            // The cookie written will be usable for the SPA in a sibling web domain
            domain: `.${this._configuration.api.cookieRootDomain}`,

            // The cookie is only sent during OAuth related requests, and all Web / API requests are cookieless
            path: this._configuration.client.cookiePath,

            // Other domains cannot send the cookie, which reduces cross site scripting risks
            sameSite: 'strict',
        };
    }
}
