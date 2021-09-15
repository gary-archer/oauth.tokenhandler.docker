import {CookieSerializeOptions} from 'cookie';
import {encryptCookie, decryptCookie} from 'cookie-encrypter';
import {randomBytes} from 'crypto';
import {ApiConfiguration} from '../configuration/apiConfiguration';
import {ClientConfiguration} from '../configuration/clientConfiguration';
import {ErrorUtils} from '../errors/errorUtils';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';

/*
 * A class to deal with cookie specific responsibilities
 */
export class CookieService {

    private readonly _apiConfiguration: ApiConfiguration;
    private readonly _clientConfiguration: ClientConfiguration;
    private readonly _encryptionKey: Buffer;

    public constructor(apiConfiguration: ApiConfiguration, clientConfiguration: ClientConfiguration) {

        this._apiConfiguration = apiConfiguration;
        this._clientConfiguration = clientConfiguration;
        this._encryptionKey = Buffer.from(this._apiConfiguration.cookieEncryptionKey, 'base64');
    }

    /*
     * Write a same site state cookie when a login starts
     */
    public writeStateCookie(data: any, response: AbstractResponse): void {

        const cookieName = this._getCookieName('state');
        const encryptedData = encryptCookie(JSON.stringify(data), {key: this._encryptionKey});
        response.addCookie(cookieName, encryptedData, this._getCookieOptions());
    }

    /*
     * Read the state cookie when a login ends
     */
    public readStateCookie(request: AbstractRequest): any {

        const cookieName = this._getCookieName('state');
        const encryptedData = request.getCookie(cookieName);
        if (encryptedData) {

            const serialized = this._decryptCookie(cookieName, encryptedData);
            return JSON.parse(serialized);
        }

        return null;
    }

    /*
     * Generate a field used to protect the auth cookie
     */
    public generateAntiForgeryValue(): string {
        return randomBytes(32).toString('base64');
    }

    /*
     * Write a same site cookie containing the refresh token
     */
    public writeRefreshCookie(refreshToken: string, response: AbstractResponse): void {

        const cookieName = this._getCookieName('refresh');
        const encryptedData = encryptCookie(refreshToken, {key: this._encryptionKey});
        response.addCookie(cookieName, encryptedData, this._getCookieOptions());
    }

    /*
     * Read the refresh token from the auth cookie
     */
    public readRefreshCookie(request: AbstractRequest): string | null {

        const cookieName = this._getCookieName('refresh');
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

        const cookieName = this._getCookieName('access');
        const encryptedData = encryptCookie(accessToken, {key: this._encryptionKey});
        response.addCookie(cookieName, encryptedData, this._getCookieOptions());
    }

    /*
     * Write a same site cookie containing the id token, in case needed for logout
     */
    public writeIdCookie(idToken: string, response: AbstractResponse): void {

        const cookieName = this._getCookieName('id');
        const encryptedData = encryptCookie(idToken, {key: this._encryptionKey});
        response.addCookie(cookieName, encryptedData, this._getCookieOptions());
    }

    /*
     * Read the id cookie if needed for logout
     */
    public readIdCookie(request: AbstractRequest): string | null {

        const cookieName = this._getCookieName('id');
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

        const cookieName = this._getCookieName('aft');
        const encryptedData = encryptCookie(value, {key: this._encryptionKey});
        response.addCookie(cookieName, encryptedData, this._getCookieOptions());
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
    public readAntiForgeryCookie(request: AbstractRequest): string | null {

        const cookieName = this._getCookieName('aft');
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

        const options = this._getCookieOptions();
        options.expires = new Date(0);
        response.addCookie(this._getCookieName('state'), '', options);
    }

    /*
     * Clear all cookies when the user session expires
     */
    public clearAll(response: AbstractResponse): void {

        const options = this._getCookieOptions();
        options.expires = new Date(0);

        response.addCookie(this._getCookieName('refresh'), '', options);
        response.addCookie(this._getCookieName('access'), '', options);
        response.addCookie(this._getCookieName('id'), '', options);
        response.addCookie(this._getCookieName('aft'), '', options);
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
     * Both our auth cookie and anti forgery cookie use the same options
     */
    private _getCookieOptions(): CookieSerializeOptions {

        return {

            // The cookie cannot be read by Javascript code, but any logged in user can get the cookie via HTTP tools
            httpOnly: true,

            // The cookie can only be sent over an HTTPS connection
            secure: true,

            // The cookie written will be usable for the SPA in a sibling web domain
            domain: this._apiConfiguration.cookieRootDomain,

            // The cookie is only sent during OAuth related requests, and all Web / API requests are cookieless
            path: this._clientConfiguration.path,

            // Other domains cannot send the cookie, which reduces cross site scripting risks
            sameSite: 'strict',
        };
    }
}
