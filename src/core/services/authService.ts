import {Configuration} from '../configuration/configuration';
import {ErrorHandler} from '../errors/errorHandler';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';
import {Logger} from '../utilities/logger';
import {CookieService} from './cookieService';
import {MockOAuthServiceImpl} from './mockOAuthServiceImpl';
import {OAuthService} from './oauthService';
import {OAuthServiceImpl} from './oauthServiceImpl';

/*
 * The entry point for token endpoint related operations
 */
export class AuthService {

    // Worker classes
    private readonly _configuration: Configuration;
    private readonly _oauthService: OAuthService;
    private readonly _cookieService: CookieService;

    // CSRF constants
    private readonly _responseBodyFieldName = 'csrf_field';
    private readonly _requestHeaderFieldName = 'x-mycompany-finalspa-refresh-csrf';

    public constructor(configuration: Configuration) {

        this._configuration = configuration;
        //this._oauthService = configuration.useMockResponses ? new MockOAuthServiceImpl() : new OAuthServiceImpl(configuration);
        this._oauthService = new MockOAuthServiceImpl();
        this._cookieService = new CookieService(configuration.cookieRootDomain, configuration.cookieEncryptionKey);
    }

    /*
     * Process an authorization code grant message
     */
    public async authorizationCodeGrant(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Proxy the request to the authorization server
        const clientId = this._validateAndGetClientId(request, false);
        Logger.info(`Proxying Authorization Code Grant for client ${clientId}`);
        const authCodeGrantData = await this._oauthService.sendAuthorizationCodeGrant(request, response);

        // Get the refresh token
        const refreshToken = authCodeGrantData.refresh_token;
        if (!refreshToken) {
            throw ErrorHandler.fromSecurityVerificationError(
                'TNo refresh token was received in the authorization code grant response from the Authorization Server');
        }

        // Write the refresh token to an HTTP only cookie
        this._cookieService.writeAuthCookie(clientId, refreshToken, response);

        // Write a CSRF HTTP only cookie containing tokens
        const randomValue = this._oauthService.generateCsrfField();
        this._cookieService.writeCsrfCookie(clientId, response, randomValue);
        authCodeGrantData[this._responseBodyFieldName] = randomValue;

        // Also give the UI the CSRF field in the response body
        const data = {} as any;
        data[this._responseBodyFieldName] = randomValue;
        response.setBody(data);
    }

    /*
     * Process a refresh token grant message
     */
    public async refreshTokenGrant(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Get the refresh token from the auth cookie
        const clientId = this._validateAndGetClientId(request, true);
        Logger.info(`Proxying Refresh Token Grant for client ${clientId}`);
        const refreshToken = this._cookieService.readAuthCookie(clientId, request);

        // Send it to the Authorization Server
        const refreshTokenGrantData =
            await this._oauthService.sendRefreshTokenGrant(refreshToken, request, response);

        // Handle updated refresh tokens
        const rollingRefreshToken = refreshTokenGrantData.refresh_token;
        if (rollingRefreshToken) {

            // If a new refresh token has been issued, remove it from the response to the SPA and update the cookie
            delete refreshTokenGrantData.refresh_token;
            this._cookieService.writeAuthCookie(clientId, rollingRefreshToken, response);
        }

        // Send access and id tokens to the SPA
        response.setBody(refreshTokenGrantData);
    }

    /*
     * Make the refresh token act expired
     */
    public async expireRefreshToken(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        const clientId = this._validateAndGetClientId(request, true);
        Logger.info(`Expiring Refresh Token for client ${clientId}`);

        // Get the current refresh token
        const refreshToken = this._cookieService.readAuthCookie(clientId, request);

        // Write a corrupted refresh token to the cookie, which will fail on the next token renewal attempt
        this._cookieService.expire(clientId, refreshToken, request, response);
        response.setStatusCode(204);
    }

    /*
     * An operation to clear cookies when the user session ends
     */
    public async clearCookies(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Validate and get client details
        const clientId = this._validateAndGetClientId(request, true);
        Logger.info(`Clearing Cookies for client ${clientId}`);

        // Clear all cookies for this client
        this._cookieService.clearAll(clientId, response);
        response.setStatusCode(204);
    }

    /*
     * Do some initial verification and then return the client id from the request body
     */
    private _validateAndGetClientId(request: AbstractRequest, requireCsrfCookie: boolean): string {

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
    private _validateOrigin(request: AbstractRequest): void {

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
    private _getClientId(request: AbstractRequest): string {

        const body = request.getBody();
        if (body && body.client_id) {
            return body.client_id;
        }

        throw ErrorHandler.fromSecurityVerificationError(
            'No client_id was found in the received form url encoded data');
    }

    /*
     * Extra mitigation in the event of malicious code trying to POST a refresh token grant request via a scripted form
     * https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
     */
    private _validateCsrfCookie(clientId: string, request: AbstractRequest) {

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
