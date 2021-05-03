import {Configuration} from '../configuration/configuration';
import {ErrorHandler} from '../errors/errorHandler';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';
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
     * Calculate the authorization redirect URL and write a state cookie
     */
    public async startLogin(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        this._validateOrigin(request);

        // Set the response body to the login redirect URI
        const data = {} as any;
        data['authorization_uri'] = 'https://whatevar';
        response.setBody(data);

        // Form the cookie data
        const cookieData = {
            state: 'xxx',
            codeVerifier: 'yyy',
        }

        // Write the state cookie
        this._cookieService.writeStateCookie(this._configuration.name, cookieData, response);
    }

    /*
     * Complete login by swapping the authorization code for tokens
     */
    public async endLogin(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        this._validateOrigin(request);
        
        // Check that the cookie state matches the state in the request body
        const cookieState = this._cookieService.readStateCookie(this._configuration.name, request);

        // Send the request to the authorization server
        const authCodeGrantData = await this._oauthService.sendAuthorizationCodeGrant(request, response);

        // Get the refresh token
        const refreshToken = authCodeGrantData.refresh_token;
        if (!refreshToken) {
            throw ErrorHandler.fromSecurityVerificationError(
                'No refresh token was received in the authorization code grant response');
        }

        // Get the id token
        const idToken = authCodeGrantData.id_token;
        if (!idToken) {
            throw ErrorHandler.fromSecurityVerificationError(
                'No id token was received in the authorization code grant response');
        }

        // Write the refresh token and id token to HTTP only cookies
        this._cookieService.writeAuthCookie(this._configuration.name, refreshToken, response);
        this._cookieService.writeIdCookie(this._configuration.name, idToken, response);

        // Write an anti forgery token into an encrypted HTTP only cookie
        const randomValue = this._oauthService.generateAntiForgeryValue();
        this._cookieService.writeAntiForgeryCookie(this._configuration.name, response, randomValue);

        // Also give the UI the anti forgery token in the response body
        const data = {} as any;
        data['anti_forgery_token'] = randomValue;
        response.setBody(data);
    }

    /*
     * Return an access token using the refresh token in the auth cookie
     */
    public async refreshToken(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the refresh token from the auth cookie
        const refreshToken = this._cookieService.readAuthCookie(this._configuration.name, request);

        // Send it to the Authorization Server
        const refreshTokenGrantData =
            await this._oauthService.sendRefreshTokenGrant(refreshToken, request, response);

        // Handle updated refresh tokens
        const newRefreshToken = refreshTokenGrantData.refresh_token;
        if (newRefreshToken) {
            this._cookieService.writeAuthCookie(this._configuration.name, newRefreshToken, response);
        }

        // Handle updated id tokens
        const newIdToken = refreshTokenGrantData.id_token;
        if (newIdToken) {
            this._cookieService.writeIdCookie(this._configuration.name, newIdToken, response);
        }

        // Write an updated anti forgery cookie
        const randomValue = this._oauthService.generateAntiForgeryValue();
        this._cookieService.writeAntiForgeryCookie(this._configuration.name, response, randomValue);

        // Return the access token and the anti forgery token in the response body
        const data = {} as any;
        data.access_token = refreshTokenGrantData.access_token;
        data['anti_forgery_token'] = randomValue;
        response.setBody(data);
    }

    /*
     * Make the refresh token act expired
     */
    public async expireSession(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the current refresh token
        const refreshToken = this._cookieService.readAuthCookie(this._configuration.name, request);

        // Write a corrupted refresh token to the cookie, which will fail on the next token renewal attempt
        this._cookieService.expireAuthCookie(this._configuration.name, refreshToken, response);
        response.setStatusCode(204);
    }

    /*
     * Return the logout URL and clear auth cookies
     */
    public async startLogout(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Clear all cookies for this client
        this._cookieService.clearAll(this._configuration.name, response);
        response.setStatusCode(204);
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
    private _validateStateCookie(request: AbstractRequest) {

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
