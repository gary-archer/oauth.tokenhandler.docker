import base64url from 'base64url';
import {createHash, randomBytes} from 'crypto';

/*
 * Deal with OAuth random state values
 * https://auth0.com/docs/flows/call-your-api-using-the-authorization-code-flow-with-pkce
 */
export class OAuthLoginState {

    private _state: string;
    private _codeVerifier: string;
    private _codeChallenge: string;

    /*
     * Generate the login state when constructed
     */
    public constructor() {

        const verifierBytes = this._getBytes();
        this._state = base64url.encode(this._getBytes());
        this._codeVerifier = base64url.encode(verifierBytes);
        this._codeChallenge = base64url.encode(this._sha256(this._codeVerifier));
    }

    public get state(): string {
        return this._state;
    }

    public get codeVerifier(): string {
        return this._codeVerifier;
    }

    public get codeChallenge(): string {
        return this._codeChallenge;
    }

    /*
     * Return random bytes
     */
    private _getBytes(): Buffer {
        return randomBytes(32);
    }

    /*
     * Convert a previously generated buffer to a string
     */
    private _sha256(input: string): Buffer {
        return createHash('sha256').update(input).digest();
    }
}
