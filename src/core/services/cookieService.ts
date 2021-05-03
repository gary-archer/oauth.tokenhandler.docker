import cookie, {CookieSerializeOptions} from 'cookie';
import {encryptCookie, decryptCookie} from 'cookie-encrypter';
import {HostConfiguration} from '../configuration/hostConfiguration';
import {ErrorHandler} from '../errors/errorHandler';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';

/*
 * Our cookie service class will deal with cookie handling during requests to the token endpoint
 */
export class CookieService {

    private readonly _configuration: HostConfiguration;
    private readonly _encryptionKey: Buffer;

    public constructor(configuration: HostConfiguration) {
        this._encryptionKey = Buffer.from(configuration.cookieEncryptionKey, 'base64');
        this._configuration = configuration;
    }

    /*
     * Write a same site state cookie when a login starts
     */
    public writeStateCookie(app: string, data: any, response: AbstractResponse): void {

        const cookieName = this._getCookieName(app, 'state');
        const encryptedData = encryptCookie(JSON.stringify(data), {key: this._encryptionKey});
        response.addCookie(this._formatCookie(cookieName, encryptedData));
    }

    /*
     * Read the state cookie when a login ends
     */
    public readStateCookie(app: string, request: AbstractRequest): any {

        const cookieName = this._getCookieName(app, 'state');
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
    public writeAuthCookie(app: string, refreshToken: string, response: AbstractResponse): void {

        const cookieName = this._getCookieName(app, 'auth');
        const encryptedData = encryptCookie(refreshToken, {key: this._encryptionKey});
        response.addCookie(this._formatCookie(cookieName, encryptedData));
    }

    /*
     * Read the refresh token from the auth cookie
     */
    public readAuthCookie(app: string, request: AbstractRequest): string {

        const cookieName = this._getCookieName(app, 'auth');
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {
            return this._decryptCookie(cookieName, encryptedData);
        }

        throw ErrorHandler.fromMissingCookieError('No auth cookie was found in the incoming request');
    }

    /*
     * Write a same site cookie containing the id token, in case needed for logout
     */
    public writeIdCookie(app: string, idToken: string, response: AbstractResponse): void {

        const cookieName = this._getCookieName(app, 'id');
        const encryptedData = encryptCookie(idToken, {key: this._encryptionKey});
        response.addCookie(this._formatCookie(cookieName, encryptedData));
    }

    /*
     * Read the id cookie if needed for logout
     */
    public readIdCookie(app: string, request: AbstractRequest): void {

        const cookieName = this._getCookieName(app, 'id');
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {
            return this._decryptCookie(cookieName, encryptedData);
        }

        throw ErrorHandler.fromMissingCookieError('No id cookie was found in the incoming request');
    }

    /*
     * Write a cookie to make it harder for malicious code to post bogus forms to our token refresh endpoint
     */
    public writeAntiForgeryCookie(app: string, response: AbstractResponse, value: string): void {

        const cookieName = this._getCookieName(app, 'aft');
        const encryptedData = encryptCookie(value, {key: this._encryptionKey});
        response.addCookie(this._formatCookie(cookieName, encryptedData));
    }

    /*
     * We also derive the request header value from this class
     */
    public getAntiForgeryRequestHeaderName(app: string): string {

        const cookieName = this._getCookieName(app, 'aft');
        return `x-${cookieName}`;
    }

    /*
     * Read the anti forgery value from the auth cookie
     */
    public readAntiForgeryCookie(app: string, request: AbstractRequest): string {

        const cookieName = this._getCookieName(app, 'aft');
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
    public expireAuthCookie(app: string, refreshToken: string, response: AbstractResponse): void {

        const expiredRefreshToken = `x${refreshToken}x`;
        this.writeAuthCookie(app, expiredRefreshToken, response);
    }

    /*
     * Clear all cookies when the user session expires
     */
    public clearAll(app: string, response: AbstractResponse): void {

        response.addCookie(this._clearCookie(`${this._getCookieName(app, 'auth')}`));
        response.addCookie(this._clearCookie(`${this._getCookieName(app, 'id')}`));
        response.addCookie(this._clearCookie(`${this._getCookieName(app, 'aft')}`));
    }

    /*
     * Return a cookie of the form 'mycompany-auth-finalspa'
     */
    private _getCookieName(app: string, type: string) {
        return `${this._configuration.cookiePrefix}-${type}-${app}`;
    }

    /*
     * Format a same site cookie for the web domain
     */
    private _formatCookie(name: string, value: string): string {
        return cookie.serialize(name, value, this._getCookieOptions());
    }

    /*
     * Clear a same site cookie
     */
    private _clearCookie(name: string): string {

        const options = this._getCookieOptions();
        options.expires = new Date(0);
        return cookie.serialize(name, '', options);
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

            // The cookie written by this app will be usable for SPAs in a sibling web domain
            domain: `.${this._configuration.cookieRootDomain}`,

            // The cookie is only sent during OAuth related requests, and all Web / API requests are cookieless
            path: '/spa',

            // Other domains cannot send the cookie, which reduces cross site scripting risks
            sameSite: 'strict',
        };
    }
}
