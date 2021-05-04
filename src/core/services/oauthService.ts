import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';
import {OAuthLoginState} from '../utilities/oauthLoginState';

/*
 * An abstraction for getting non deterministic data, including responses from the Authorization Server
 */
export interface OAuthService {

    // Generate random values to protect against pasted login responses
    generateLoginState(): OAuthLoginState;

    // Generate a value to protect the auth cookie
    generateAntiForgeryValue(): string;

    // Forward the authorization code grant to the Authorization Server to complete a login
    sendAuthorizationCodeGrant(request: AbstractRequest, response: AbstractResponse, codeVerifier: string): Promise<any>;

    // Forward the refresh token grant to the Authorization Server to get a new access token
    sendRefreshTokenGrant(refreshToken: string, request: AbstractRequest, response: AbstractResponse): Promise<any>;
}
