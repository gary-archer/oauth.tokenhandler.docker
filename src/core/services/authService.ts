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

    private readonly _configuration: Configuration;
    private readonly _oauthService: OAuthService;
    private readonly _cookieService: CookieService;

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

        // Write an anti forgery token into an encrypted HTTP only cookie
        const randomValue = this._oauthService.generateAntiForgeryValue();
        this._cookieService.writeAntiForgeryCookie(this._configuration.name, response, randomValue);

        // Also give the UI the anti forgery token in the response body
        const data = {} as any;
        data['anti_forgery_token'] = randomValue;
        response.setBody(data);
    }

    /*
     * Process a refresh token grant message
     */
    public async refreshTokenGrant(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        this._validate(request, true);

        // Get the refresh token from the auth cookie
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
        this._validate(request, true);

        // Clear all cookies for this client
        this._cookieService.clearAll(this._configuration.name, response);
        response.setStatusCode(204);
    }

    /*
     * Do some initial verification and then return the client id from the request body
     */
    private _validate(request: AbstractRequest, requireAntiForgeryCookie: boolean): void {

        // Check the HTTP request has the expected web origin
        this._validateOrigin(request);

        // For token refresh requests, also check that the HTTP request has an extra header
        if (requireAntiForgeryCookie) {
            this._validateAntiForgeryCookie(request);
        }
    }

    /*
     * If there is a web origin, make sure it matches the expected value
     */
    private _validateOrigin(request: AbstractRequest): void {

        const origin = request.getHeader('origin');
        console.log(`Origin header is ${origin}`);
        if (!origin || origin.toLowerCase() !== this._configuration.trustedWebOrigin.toLowerCase()) {
            throw ErrorHandler.fromSecurityVerificationError(
                'The origin header was missing or contained an untrusted value');
        }
    }

    /*
     * Extra mitigation in the event of malicious code calling this API and implicitly sending the auth cookie
     */
    private _validateAntiForgeryCookie(request: AbstractRequest) {

        // Get the cookie value
        const cookieValue = this._cookieService.readAntiForgeryCookie(this._configuration.name, request);

        // Check there is a matching anti forgery token field
        const headerName = this._cookieService.getAntiForgeryRequestHeaderName(this._configuration.name);
        const headerValue = request.getHeader(headerName);
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
