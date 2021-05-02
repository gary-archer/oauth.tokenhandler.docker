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

        // Check incoming details
        Logger.info(`Sending Authorization Code Grant for ${this._configuration.name}`);
        this._validate(request, false);

        // Send the request to the authorization server
        const authCodeGrantData = await this._oauthService.sendAuthorizationCodeGrant(request, response);

        // Get the refresh token
        const refreshToken = authCodeGrantData.refresh_token;
        if (!refreshToken) {
            throw ErrorHandler.fromSecurityVerificationError(
                'TNo refresh token was received in the authorization code grant response');
        }

        // Write the refresh token to an HTTP only cookie
        this._cookieService.writeAuthCookie(this._configuration.name, refreshToken, response);

        // Write a CSRF HTTP only cookie containing tokens
        const randomValue = this._oauthService.generateCsrfField();
        this._cookieService.writeCsrfCookie(this._configuration.name, response, randomValue);
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

        // Check incoming details
        this._validate(request, false);

        // Get the refresh token from the auth cookie
        Logger.info(`Sending Refresh Token Grant for ${this._configuration.name}`);
        const refreshToken = this._cookieService.readAuthCookie(this._configuration.name, request);

        // Send it to the Authorization Server
        const refreshTokenGrantData =
            await this._oauthService.sendRefreshTokenGrant(refreshToken, request, response);

        // Handle updated refresh tokens
        const rollingRefreshToken = refreshTokenGrantData.refresh_token;
        if (rollingRefreshToken) {

            // If a new refresh token has been issued, update the auth cookie
            this._cookieService.writeAuthCookie(this._configuration.name, rollingRefreshToken, response);
        }

        // Send the access token to the SPA
        const data = {} as any;
        data.access_token = refreshTokenGrantData.access_token;
        response.setBody(data);
    }

    /*
     * Make the refresh token act expired
     */
    public async expireRefreshToken(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        Logger.info(`Expiring refresh token for ${this._configuration.name}`);
        this._validate(request, true);

        // Get the current refresh token
        const refreshToken = this._cookieService.readAuthCookie(this._configuration.name, request);

        // Write a corrupted refresh token to the cookie, which will fail on the next token renewal attempt
        this._cookieService.expire(this._configuration.name, refreshToken, request, response);
        response.setStatusCode(204);
    }

    /*
     * An operation to clear cookies when the user session ends
     */
    public async expireSession(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        Logger.info(`Clearing cookies for ${this._configuration.name}`);
        this._validate(request, true);

        // Clear all cookies for this client
        this._cookieService.clearAll(this._configuration.name, response);
        response.setStatusCode(204);
    }

    /*
     * Do some initial verification and then return the client id from the request body
     */
    private _validate(request: AbstractRequest, requireCsrfCookie: boolean): void {

        // Check the HTTP request has the expected web origin
        this._validateOrigin(request);

        // For token refresh requests, also check that the HTTP request has an extra header
        if (requireCsrfCookie) {
            this._validateCsrfCookie(request);
        }
    }

    /*
     * If there is a web origin, make sure it matches the expected value
     */
    private _validateOrigin(request: AbstractRequest): void {

        const origin = request.getHeader('origin');
        if (!origin || origin.toLowerCase() !== this._configuration.trustedWebOrigin.toLowerCase()) {
            throw ErrorHandler.fromSecurityVerificationError(
                'The origin header was missing or contained an untrusted value');
        }
    }

    /*
     * Extra mitigation in the event of malicious code calling this API and implicitly sending the auth cookie
     */
    private _validateCsrfCookie(request: AbstractRequest) {

        // Get the CSRF cookie value
        const cookieValue = this._cookieService.readCsrfCookie(this._configuration.name, request);

        // Check there is a matching anti forgery token field
        const headerValue = request.getHeader(this._requestHeaderFieldName);
        if (!headerValue) {
            throw ErrorHandler.fromSecurityVerificationError('No anti forgery request header field was supplied');
        }

        // Check that the values match
        if (cookieValue !== headerValue) {
            throw ErrorHandler.fromSecurityVerificationError(
                'The anti forgery request header does not match the anti forgery cookie value');
        }
    }
}
