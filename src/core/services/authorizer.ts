import {ApiConfiguration} from '../configuration/apiConfiguration';
import {ErrorUtils} from '../errors/errorUtils';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';
import {CookieService} from './cookieService';
import {OAuthService} from './oauthService';

/*
 * The entry point class for the OAuth Proxy API's logic, which performs an outline of processing
 */
export class Authorizer {

    private readonly _apiConfiguration: ApiConfiguration;
    private readonly _oauthService: OAuthService;
    private readonly _cookieService: CookieService;

    public constructor(
        apiConfiguration: ApiConfiguration,
        cookieService: CookieService,
        oauthService: OAuthService) {

        this._apiConfiguration = apiConfiguration;
        this._cookieService = cookieService;
        this._oauthService = oauthService;
        this._setupCallbacks();
    }

    /*
     * Calculate the authorization redirect URL and write a state cookie
     */
    public async startLogin(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        request.getLogEntry().setOperationName('startLogin');
        this._validateOrigin(request);

        // First create a random login state
        const loginState = this._oauthService.generateLoginState();

        // Write the full URL to the response body
        const data = {} as any;
        data.authorizationRequestUri = this._oauthService.getAuthorizationRequestUri(loginState);
        response.setBody(data);

        // Also write a temporary state cookie
        const cookieData = {
            state: loginState.state,
            codeVerifier: loginState.codeVerifier,
        };
        this._cookieService.writeStateCookie(cookieData, response);
    }

    /*
     * Complete login by swapping the authorization code for tokens and storing tokens in secure cookies
     */
    public async endLogin(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        request.getLogEntry().setOperationName('endLogin');
        this._validateOrigin(request);

        // Read the state cookie and then clear it
        const stateCookie = this._cookieService.readStateCookie(request);
        if (!stateCookie) {
            throw ErrorUtils.fromMissingCookieError('state');
        }
        this._cookieService.clearStateCookie(response);

        // Check that the value posted matches that in the cookie
        const state = request.getJsonField('state');
        if (state !== stateCookie.state) {
            throw ErrorUtils.fromInvalidStateError();
        }

        // Get the code value
        const code = request.getJsonField('code');
        if (!code) {
            throw ErrorUtils.fromMissingFieldError('code');
        }

        // Send the Authorization Code Grant message to the Authorization Server
        const authCodeGrantData = await this._oauthService.sendAuthorizationCodeGrant(code, stateCookie.codeVerifier);

        // Get the refresh token from the response
        const refreshToken = authCodeGrantData.refresh_token;
        if (!refreshToken) {
            throw ErrorUtils.fromMessage('No refresh token was received in an authorization code grant response');
        }

        // Get the id token from the response
        const idToken = authCodeGrantData.id_token;
        if (!idToken) {
            throw ErrorUtils.fromMessage('No id token was received in an authorization code grant response');
        }

        // Write both the refresh token and id token to separate HTTP only encrypted same site cookies
        this._cookieService.writeAuthCookie(refreshToken, response);
        this._cookieService.writeIdCookie(idToken, response);

        // Return a body consisting only of the anti forgery token
        const data = {} as any;
        this._addAntiForgeryResponseData(response, data);
        response.setBody(data);
    }

    /*
     * Get a new access token using the refresh token in the auth cookie
     */
    public async refreshToken(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        request.getLogEntry().setOperationName('refreshToken');
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the refresh token from the auth cookie
        const refreshToken = this._cookieService.readAuthCookie(request);
        if (!refreshToken) {
            throw ErrorUtils.fromMissingCookieError('auth');
        }

        // Get the id token from the id cookie
        const idToken = this._cookieService.readAuthCookie(request);
        if (!idToken) {
            throw ErrorUtils.fromMissingCookieError('id');
        }

        // Send the request for a new access token to the Authorization Server
        const refreshTokenGrantData =
            await this._oauthService.sendRefreshTokenGrant(refreshToken);

        // Rewrite the refresh token cookie since the refresh token may have been renewed
        const newRefreshToken = refreshTokenGrantData.refresh_token;
        this._cookieService.writeAuthCookie(newRefreshToken ?? refreshToken, response);

        // Rewrite the id token cookie since the id token may have been renewed
        const newIdToken = refreshTokenGrantData.id_token;
        this._cookieService.writeIdCookie(newIdToken ?? idToken, response);

        // Return a body consisting only of the access token and an anti forgery token
        const data = {} as any;
        data.accessToken = refreshTokenGrantData.access_token;
        this._addAntiForgeryResponseData(response, data);
        response.setBody(data);
    }

    /*
     * Make the refresh token act expired for test purposes
     */
    public async expireSession(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        request.getLogEntry().setOperationName('expireSession');
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the current refresh token
        const refreshToken = this._cookieService.readAuthCookie(request);
        if (!refreshToken) {
            throw ErrorUtils.fromMissingCookieError('auth');
        }

        // Write a corrupted refresh token to the cookie, which will fail on the next token refresh attempt
        const expiredRefreshToken = `x${refreshToken}x`;
        this._cookieService.writeAuthCookie(expiredRefreshToken, response);
        response.setStatusCode(204);
    }

    /*
     * Return the logout URL and clear auth cookies
     */
    public async startLogout(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        request.getLogEntry().setOperationName('startLogout');
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the id token from the id cookie
        const idToken = this._cookieService.readIdCookie(request);
        if (!idToken) {
            throw ErrorUtils.fromMissingCookieError('id');
        }

        // Clear all cookies for the caller
        this._cookieService.clearAll(response);

        // Write the full end session URL to the response body
        const data = {} as any;
        data.endSessionRequestUri = this._oauthService.getEndSessionRequestUri(idToken);
        response.setBody(data);
        response.setStatusCode(200);
    }

    /*
     * Make sure there is a web origin, as supported by the 4 main browsers, and make sure it matches the expected value
     */
    private _validateOrigin(request: AbstractRequest): void {

        const origin = request.getHeader('origin');
        if (!origin) {
            throw ErrorUtils.fromMissingFieldError('origin');
        }

        if (origin.toLowerCase() !== this._apiConfiguration.trustedWebOrigin.toLowerCase()) {
            throw ErrorUtils.fromInvalidOriginError();
        }
    }

    /*
     * Extra mitigation in the event of malicious code calling this API and implicitly sending the auth cookie
     */
    private _validateAntiForgeryCookie(request: AbstractRequest): void {

        // Get the cookie value
        const cookieValue = this._cookieService.readAntiForgeryCookie(request);
        if (!cookieValue) {
            throw ErrorUtils.fromMissingCookieError('aft');
        }

        // Check the client has sent a matching anti forgery request header
        const headerName = this._cookieService.getAntiForgeryRequestHeaderName();
        const headerValue = request.getHeader(headerName);
        if (!headerValue) {
            throw ErrorUtils.fromMissingFieldError(headerName);
        }

        // Check that the values match
        if (cookieValue !== headerValue) {
            throw ErrorUtils.fromInvalidAntiForgeryTokenError();
        }
    }

    /*
     * Add anti forgery details to the response when ending a login or when refreshing a token
     */
    private _addAntiForgeryResponseData(response: AbstractResponse, data: any): void {

        // Get a random value
        const randomValue = this._cookieService.generateAntiForgeryValue();

        // Set an anti forgery HTTP Only encrypted cookie
        this._cookieService.writeAntiForgeryCookie(response, randomValue);

        // Also give the UI the anti forgery token in the response body
        data.antiForgeryToken = randomValue;
    }

    /*
     * Make the this parameter available for when the API is called
     */
    private _setupCallbacks(): void {
        this.startLogin = this.startLogin.bind(this);
        this.endLogin = this.endLogin.bind(this);
        this.refreshToken = this.refreshToken.bind(this);
        this.expireSession = this.expireSession.bind(this);
        this.startLogout = this.startLogout.bind(this);

    }
}
