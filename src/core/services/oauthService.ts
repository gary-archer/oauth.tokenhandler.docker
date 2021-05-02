import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';

/*
 * An abstraction for getting non deterministic data, including responses from the Authorization Server
 */
export interface OAuthService {

    // Forward the authorization code grant to the Authorization Server to complete a login
    sendAuthorizationCodeGrant(request: AbstractRequest, response: AbstractResponse): Promise<any>;

    // Forward the refresh token grant to the Authorization Server to get a new access token
    sendRefreshTokenGrant(refreshToken: string, request: AbstractRequest, response: AbstractResponse): Promise<any>;

    // Generate a value to protect the cookie
    generateCsrfField(): string;
}
