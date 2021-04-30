import {Configuration} from '../configuration/configuration';
import {LambdaEdgeRequest} from '../edge/lambdaEdgeRequest';
import {LambdaEdgeResponse} from '../edge/lambdaEdgeResponse';
import {Logger} from '../utilities/logger';
import {CookieService} from './cookieService';
import {ProxyService} from './proxyService';
import {ErrorHandler} from '../errors/errorHandler';

/*
 * The entry point for token endpoint related operations
 */
export class AuthService {

    // Worker classes
    private readonly _configuration: Configuration;
    private readonly _proxyService: ProxyService;
    private readonly _cookieService: CookieService;

    // CSRF constants
    private readonly _responseBodyFieldName = 'csrf_field';
    private readonly _requestHeaderFieldName = 'x-mycompany-finalspa-refresh-csrf';

    public constructor(configuration: Configuration, proxyService: ProxyService) {
        this._configuration = configuration;
        this._proxyService = proxyService;
        this._cookieService = new CookieService(configuration.cookieRootDomain, configuration.cookieEncryptionKey);
    }

    /*
     * Process an authorization code grant message
     */
    public async authorizationCodeGrant(request: LambdaEdgeRequest, response: LambdaEdgeResponse): Promise<void> {

        // Proxy the request to the authorization server
        const clientId = this._validateAndGetClientId(request, false);
        Logger.info(`Proxying Authorization Code Grant for client ${clientId}`);
        const authCodeGrantData = await this._proxyService.sendAuthorizationCodeGrant(request, response);

        // Get the refresh token
        const refreshToken = authCodeGrantData.refresh_token;
        if (refreshToken) {

            // Write the refresh token to an HTTP only cookie
            delete authCodeGrantData.refresh_token;
            this._cookieService.writeAuthCookie(clientId, refreshToken, response);

            // Write a CSRF HTTP only cookie and also give the UI the value in a response field
            const randomValue = this._proxyService.generateCsrfField();
            this._cookieService.writeCsrfCookie(clientId, response, randomValue);
            authCodeGrantData[this._responseBodyFieldName] = randomValue;
        }

        // Send access and id tokens to the SPA
        response.body = authCodeGrantData;
    }

    /*
     * Process a refresh token grant message
     */
    public async refreshTokenGrant(request: LambdaEdgeRequest, response: LambdaEdgeResponse): Promise<void> {

        // Get the refresh token from the auth cookie
        const clientId = this._validateAndGetClientId(request, true);
        Logger.info(`Proxying Refresh Token Grant for client ${clientId}`);
        const refreshToken = this._cookieService.readAuthCookie(clientId, request);

        // Send it to the Authorization Server
        const refreshTokenGrantData =
            await this._proxyService.sendRefreshTokenGrant(refreshToken, request, response);

        // Handle updated refresh tokens
        const rollingRefreshToken = refreshTokenGrantData.refresh_token;
        if (rollingRefreshToken) {

            // If a new refresh token has been issued, remove it from the response to the SPA and update the cookie
            delete refreshTokenGrantData.refresh_token;
            this._cookieService.writeAuthCookie(clientId, rollingRefreshToken, response);
        }

        // Send access and id tokens to the SPA
        response.body = refreshTokenGrantData;
    }

    /*
     * Make the refresh token act expired
     */
    public async expireRefreshToken(request: LambdaEdgeRequest, response: LambdaEdgeResponse): Promise<void> {

        const clientId = this._validateAndGetClientId(request, true);
        Logger.info(`Expiring Refresh Token for client ${clientId}`);

        // Get the current refresh token
        const refreshToken = this._cookieService.readAuthCookie(clientId, request);

        // Write a corrupted refresh token to the cookie, which will fail on the next token renewal attempt
        this._cookieService.expire(clientId, refreshToken, request, response);
        response.statusCode = 204;
    }

    /*
     * An operation to clear cookies when the user session ends
     */
    public async clearCookies(request: LambdaEdgeRequest, response: LambdaEdgeResponse): Promise<void> {

        // Validate and get client details
        const clientId = this._validateAndGetClientId(request, true);
        Logger.info(`Clearing Cookies for client ${clientId}`);

        // Clear all cookies for this client
        this._cookieService.clearAll(clientId, response);
        response.statusCode = 204;
    }

    /*
     * Do some initial verification and then return the client id from the request body
     */
    private _validateAndGetClientId(request: LambdaEdgeRequest, requireCsrfCookie: boolean): string {

        // Check the HTTP request has the expected web origin
        this._validateOrigin(request);

        // Get the client id from the request body
        const clientId = this._getClientId(request);

        // For token refresh requests, also check that the HTTP request has an extra header
        if (requireCsrfCookie) {
            this._validateCsrfCookie(clientId, request);
        }

        return clientId;
    }

    /*
     * If there is a web origin, make sure it matches the expected value
     */
    private _validateOrigin(request: LambdaEdgeRequest): void {

        const origin = request.getHeader('origin');
        if (origin) {
            if (origin.toLowerCase() !== this._configuration.trustedWebOrigin.toLowerCase()) {
                throw ErrorHandler.fromSecurityVerificationError(
                    `The origin header had an untrusted value of ${origin}`);
            }
        }
    }

    /*
     * All requests include a client id in the request body
     */
    private _getClientId(request: LambdaEdgeRequest): string {

        if (request.body) {
            if (request.body.client_id) {
                return request.body.client_id;
            }
        }

        throw ErrorHandler.fromSecurityVerificationError(
            'No client_id was found in the received form url encoded data');
    }

    /*
     * Extra mitigation in the event of malicious code trying to POST a refresh token grant request via a scripted form
     * https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
     */
    private _validateCsrfCookie(clientId: string, request: LambdaEdgeRequest) {

        // Get the CSRF cookie value
        const cookieValue = this._cookieService.readCsrfCookie(clientId, request);

        // Check there is a matching CSRF request field
        const headerValue = request.getHeader(this._requestHeaderFieldName);
        if (!headerValue) {
            throw ErrorHandler.fromSecurityVerificationError('No CSRF request header field was supplied');
        }

        // Check that the values match
        if (cookieValue !== headerValue) {
            throw ErrorHandler.fromSecurityVerificationError(
                'The CSRF request header does not match the CSRF cookie value');
        }
    }
}
