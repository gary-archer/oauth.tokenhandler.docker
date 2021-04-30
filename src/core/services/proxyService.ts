import {LambdaRequest} from '../../lambda/request/lambdaRequest';
import {LambdaResponse} from '../../lambda/request/lambdaResponse';

/*
 * An abstraction for getting non deterministic data, including responses from the Authorization Server
 */
export interface ProxyService {

    // Forward the authorization code grant to the Authorization Server to complete a login
    sendAuthorizationCodeGrant(request: LambdaRequest, response: LambdaResponse): Promise<any>;

    // Forward the refresh token grant to the Authorization Server to get a new access token
    sendRefreshTokenGrant(refreshToken: string, request: LambdaRequest, response: LambdaResponse): Promise<any>;

    // Generate a value to protect the cookie
    generateCsrfField(): string;
}
