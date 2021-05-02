import cookie, {CookieSerializeOptions} from 'cookie';
import {encryptCookie, decryptCookie} from 'cookie-encrypter';
import {ErrorHandler} from '../errors/errorHandler';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';

/*
 * Our cookie service class will deal with cookie handling during requests to the token endpoint
 */
export class CookieService {

    private readonly _authCookieName = 'mycompany-auth';
    private readonly _antiForgeryCookieName = 'mycompany-aft';
    private readonly _rootDomain: string;
    private readonly _encryptionKey: Buffer;

    public constructor(rootDomain: string, base64encryptionKey: string) {
        this._encryptionKey = Buffer.from(base64encryptionKey, 'base64');
        this._rootDomain = rootDomain;
    }

    /*
     * Write a same domain response cookie containing the refresh token
     */
    public writeAuthCookie(name: string, refreshToken: string, response: AbstractResponse): void {

        const encryptedData = encryptCookie(refreshToken, {key: this._encryptionKey});
        response.addCookie(this._formatCookie(`${this._authCookieName}-${name}`, encryptedData));
    }

    /*
     * Read the refresh token from the request cookie
     */
    public readAuthCookie(name: string, request: AbstractRequest): string {

        const cookieName = `${this._authCookieName}-${name}`;
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {
            return this._decryptCookie(cookieName, encryptedData);
        }

        throw ErrorHandler.fromMissingCookieError('No auth cookie was found in the incoming request');
    }

    /*
     * Write a cookie to make it harder for malicious code to post bogus forms to our token refresh endpoint
     */
    public writeAntiForgeryCookie(name: string, response: AbstractResponse, value: string): void {

        const encryptedData = encryptCookie(value, {key: this._encryptionKey});
        response.addCookie(this._formatCookie(`${this._antiForgeryCookieName}-${name}`, encryptedData));
    }

    /*
     * We also derive the request header value from this class
     */
    public getAntiForgeryRequestHeaderName(name: string): string {
        return `x-${this._antiForgeryCookieName}-${name}`;
    }

    /*
     * Write a response cookie containing an anti forgery value, which we will verify during refresh token requests
     */
    public readAntiForgeryCookie(name: string, request: AbstractRequest): string {

        const cookieName = `${this._antiForgeryCookieName}-${name}`;
        const encryptedData = request.getCookie(cookieName);
        if (!encryptedData) {
            throw ErrorHandler.fromMissingCookieError('No anti forgery cookie was found in the incoming request');
        }

        return this._decryptCookie(cookieName, encryptedData);
    }

    /*
     * Corrupt the refresh token inside the cookie by adding extra bytes to it
     * This will cause an invalid_grant error when the refresh token is next sent to the Authorization Server
     */
    public expire(
        name: string,
        refreshToken: string,
        request: AbstractRequest,
        response: AbstractResponse): void {

        const expiredRefreshToken = `x${refreshToken}x`;
        this.writeAuthCookie(name, expiredRefreshToken, response);
    }

    /*
     * Clear all cookies when the user session expires
     */
    public clearAll(name: string, response: AbstractResponse): void {

        response.addCookie(this._clearCookie(`${this._authCookieName}-${name}`));
        response.addCookie(this._clearCookie(`${this._antiForgeryCookieName}-${name}`));
    }

    /*
     * Format a same site cookie for the web domain
     */
    private _formatCookie(name: string, value: string): string {

        return cookie.serialize(name, value, this._getCookieOptions());
    }

    /*
     * Clear the same site cookie
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

            // The cookie written by this app will be sent to other web applications
            domain: `.${this._rootDomain}`,

            // The cookie is only sent during OAuth related requests, and Web / API requests are cookieless
            path: '/oauthwebproxy',

            // Other domains cannot send the cookie, which reduces cross site scripting risks
            sameSite: 'strict',
        };
    }
}
