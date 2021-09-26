import {CookieSerializeOptions} from 'cookie';
import {encryptCookie, decryptCookie} from 'cookie-encrypter';
import {randomBytes} from 'crypto';
import {ApiConfiguration} from '../configuration/apiConfiguration';
import {ClientConfiguration} from '../configuration/clientConfiguration';
import {ErrorUtils} from '../errors/errorUtils';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';

const STATE_COOKIE   = 'state';
const ACCESS_COOKIE  = 'at';
const REFRESH_COOKIE = 'rt';
const ID_COOKIE      = 'id';
const CSRF_COOKIE    = 'csrf';

/*
 * A class to deal with cookie specific responsibilities
 */
export class CookieService {

    private readonly _apiConfiguration: ApiConfiguration;
    private readonly _clientConfiguration: ClientConfiguration;
    private readonly _encryptionKey: string;

    public constructor(apiConfiguration: ApiConfiguration, clientConfiguration: ClientConfiguration) {

        this._apiConfiguration = apiConfiguration;
        this._clientConfiguration = clientConfiguration;
        this._encryptionKey = this._apiConfiguration.cookieEncryptionKey;
    }

    /*
     * Write a same site state cookie when a login starts
     */
    public writeStateCookie(data: any, response: AbstractResponse): void {

        const cookieName = this._getCookieName(STATE_COOKIE);
        const encryptedData = encryptCookie(JSON.stringify(data), {key: this._encryptionKey});
        response.addCookie(cookieName, encryptedData, this._getCookieOptions(STATE_COOKIE));
    }

    /*
     * Read the state cookie when a login ends
     */
    public readStateCookie(request: AbstractRequest): any {

        const cookieName = this._getCookieName(STATE_COOKIE);
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {

            const serialized = this._decryptCookie(cookieName, encryptedData);
            return JSON.parse(serialized);
        }

        return null;
    }

    /*
     * Generate a field used to protect cookies on data changing requests from the SPA
     */
    public generateAntiForgeryValue(): string {
        return randomBytes(32).toString('base64');
    }

    /*
     * Write a same site cookie containing the refresh token
     */
    public writeRefreshCookie(refreshToken: string, response: AbstractResponse): void {

        const cookieName = this._getCookieName(REFRESH_COOKIE);
        const encryptedData = encryptCookie(refreshToken, {key: this._encryptionKey});
        response.addCookie(cookieName, encryptedData, this._getCookieOptions(REFRESH_COOKIE));
    }

    /*
     * Read the refresh token from the cookie
     */
    public readRefreshCookie(request: AbstractRequest): string | null {

        const cookieName = this._getCookieName(REFRESH_COOKIE);
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {
            return this._decryptCookie(cookieName, encryptedData);
        }

        return null;
    }

    /*
     * Write a same site cookie containing the access token
     */
    public writeAccessCookie(accessToken: string, response: AbstractResponse): void {

        const cookieName = this._getCookieName(ACCESS_COOKIE);
        const encryptedData = encryptCookie(accessToken, {key: this._encryptionKey});
        response.addCookie(cookieName, encryptedData, this._getCookieOptions(ACCESS_COOKIE));
    }

    /*
     * Read the access token from the cookie
     */
    public readAccessCookie(request: AbstractRequest): string | null {

        const cookieName = this._getCookieName(ACCESS_COOKIE);
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {
            return this._decryptCookie(cookieName, encryptedData);
        }

        return null;
    }

    /*
     * Write a same site cookie containing the id token, in case needed for logout
     */
    public writeIdCookie(idToken: string, response: AbstractResponse): void {

        const cookieName = this._getCookieName(ID_COOKIE);
        const encryptedData = encryptCookie(idToken, {key: this._encryptionKey});
        response.addCookie(cookieName, encryptedData, this._getCookieOptions(ID_COOKIE));
    }

    /*
     * Read the id cookie if needed for logout
     */
    public readIdCookie(request: AbstractRequest): string | null {

        const cookieName = this._getCookieName(ID_COOKIE);
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {
            return this._decryptCookie(cookieName, encryptedData);
        }

        return null;
    }

    /*
     * Write a cookie to make it harder for malicious code to post bogus forms to our token refresh endpoint
     */
    public writeAntiForgeryCookie(response: AbstractResponse, value: string): void {

        const cookieName = this._getCookieName(CSRF_COOKIE);
        const encryptedData = encryptCookie(value, {key: this._encryptionKey});
        response.addCookie(cookieName, encryptedData, this._getCookieOptions(CSRF_COOKIE));
    }

    /*
     * We also derive the request header value from this class
     */
    public getAntiForgeryRequestHeaderName(): string {

        const cookieName = this._getCookieName(CSRF_COOKIE);
        return `x-${cookieName}`;
    }

    /*
     * Read the anti forgery value from the cookie
     */
    public readAntiForgeryCookie(request: AbstractRequest): string | null {

        const cookieName = this._getCookieName(CSRF_COOKIE);
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {
            return this._decryptCookie(cookieName, encryptedData);
        }

        return null;
    }

    /*
     * Clear the temporary state cookie used during login
     */
    public clearStateCookie(response: AbstractResponse): void {
        response.addCookie(this._getCookieName(STATE_COOKIE), '', this._getExpireCookieOptions(STATE_COOKIE));
    }

    /*
     * Clear all cookies when the user session expires
     */
    public clearAll(response: AbstractResponse): void {

        response.addCookie(this._getCookieName(REFRESH_COOKIE), '', this._getExpireCookieOptions(REFRESH_COOKIE));
        response.addCookie(this._getCookieName(ACCESS_COOKIE),  '', this._getExpireCookieOptions(ACCESS_COOKIE));
        response.addCookie(this._getCookieName(ID_COOKIE),      '', this._getExpireCookieOptions(ID_COOKIE));
        response.addCookie(this._getCookieName(CSRF_COOKIE),    '', this._getExpireCookieOptions(CSRF_COOKIE));
    }

    /*
     * Return a cookie of the form 'mycompany-auth-finalspa'
     */
    private _getCookieName(type: string) {
        return `${this._apiConfiguration.cookiePrefix}-${type}-${this._clientConfiguration.name}`;
    }

    /*
     * A helper method to decrypt a cookie and report errors clearly
     */
    private _decryptCookie(cookieName: string, encryptedData: string) {

        try {

            // Try the AES decryption
            return decryptCookie(encryptedData, {key: this._encryptionKey});

        } catch (e) {

            // In the event of crypto errors, log the details but return a generic error to the client
            throw ErrorUtils.fromCookieDecryptionError(cookieName, e);
        }
    }

    /*
     * All cookies use largely identical options
     */
    private _getCookieOptions(type: string): CookieSerializeOptions {

        return {

            // The cookie cannot be read by Javascript code
            httpOnly: true,

            // The cookie can only be sent over an HTTPS connection
            secure: true,

            // The cookie written is only used (by default) in the API domain
            domain: this._apiConfiguration.cookieDomain,

            // Access and CSRF cookies are sent to APIs, whereas others are private to the token handler
            path: type === (ACCESS_COOKIE || type === CSRF_COOKIE) ? '/' : this._clientConfiguration.path,

            // Other domains cannot send the cookie, which reduces cross site request forgery risks
            sameSite: 'strict',
        };
    }

    /*
     * Get options when expiring a cookie
     */
    private _getExpireCookieOptions(type: string): CookieSerializeOptions {

        const options = this._getCookieOptions(type);
        options.expires = new Date(0);
        return options;
    }
}
