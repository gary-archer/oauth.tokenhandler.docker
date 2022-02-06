import {decode} from 'jsonwebtoken';
import {ApiConfiguration} from '../configuration/apiConfiguration';
import {ErrorUtils} from '../errors/errorUtils';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';
import {UrlHelper} from '../utilities/urlHelper';
import {CookieService} from './cookieService';
import {OAuthService} from './oauthService';

/*
 * The entry point class for the Token Handler API's logic, which performs an outline of processing
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
     * The SPA sends us the full URL when the page loads, and it may contain an authorization result
     * Complete login if required, by swapping the authorization code for tokens and storing tokens in secure cookies
     */
    public async endLogin(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // First do basic validation
        request.getLogEntry().setOperationName('endLogin');
        this._validateOrigin(request);

        // Get the URL posted by the SPA
        const url = request.getJsonField('url');
        if (!url) {
            throw ErrorUtils.fromFormFieldNotFoundError('url');
        }

        // Get data from the SPA
        const query = UrlHelper.getQueryParameters(url);
        const code = query['code'];
        const state = query['state'];
        const error = query['error'];
        const errorDescription = query['error_description'];

        // Handle normal page loads, which can occur frequently during a user session
        if (!(state && code) && !(state && error)) {
            this._handlePageLoad(request, response);
            return;
        }

        // Report Authorization Server errors back to the SPA, such as those sending an invalid scope
        if (state && error) {
            throw ErrorUtils.fromLoginResponseError(error, errorDescription);
        }

        // Read the state cookie and then clear it
        const stateCookie = this._cookieService.readStateCookie(request);
        if (!stateCookie) {
            throw ErrorUtils.fromMissingCookieError('state');
        }
        this._cookieService.clearStateCookie(response);

        // Check that the value posted matches that in the cookie
        if (state !== stateCookie.state) {
            throw ErrorUtils.fromInvalidStateError();
        }

        // Send the Authorization Code Grant message to the Authorization Server
        const authCodeGrantData = await this._oauthService.sendAuthorizationCodeGrant(code, stateCookie.codeVerifier);

        const refreshToken = authCodeGrantData.refresh_token;
        if (!refreshToken) {
            throw ErrorUtils.createGenericError(
                'No refresh token was received in an authorization code grant response');
        }

        const accessToken = authCodeGrantData.access_token;
        if (!accessToken) {
            throw ErrorUtils.createGenericError(
                'No access token was received in an authorization code grant response');
        }

        // We do not validate the id token since it is received in a direct HTTPS request
        const idToken = authCodeGrantData.id_token;
        if (!idToken) {
            throw ErrorUtils.createGenericError(
                'No id token was received in an authorization code grant response');
        }

        // Include the OAuth User ID in API logs
        this._logUserId(request, idToken);

        // Write tokens to separate HTTP only encrypted same site cookies
        this._cookieService.writeRefreshCookie(refreshToken, response);
        this._cookieService.writeAccessCookie(accessToken, response);
        this._cookieService.writeIdCookie(idToken, response);

        // Inform the SPA that that a login response was handled
        const endLoginData = {
            isLoggedIn: true,
            handled: true,
        } as any;

        // Create an anti forgery cookie which will last for the duration of the multi tab browsing session
        this._createAntiForgeryResponseData(request, response, endLoginData);
        response.setBody(endLoginData);
    }

    /*
     * Write a new access token into the access token cookie
     */
    public async refresh(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        request.getLogEntry().setOperationName('refresh');
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the refresh token from the cookie
        const refreshToken = this._cookieService.readRefreshCookie(request);
        if (!refreshToken) {
            throw ErrorUtils.fromMissingCookieError('rt');
        }

        // Get the id token from the id cookie
        const idToken = this._cookieService.readIdCookie(request);
        if (!idToken) {
            throw ErrorUtils.fromMissingCookieError('id');
        }

        // Include the OAuth user id in API logs
        this._logUserId(request, idToken);

        // Send the request for a new access token to the Authorization Server
        const refreshTokenGrantData =
            await this._oauthService.sendRefreshTokenGrant(refreshToken);

        // Rewrite cookies
        const newRefreshToken = refreshTokenGrantData.refresh_token;
        const newIdToken = refreshTokenGrantData.id_token;
        this._cookieService.writeAccessCookie(refreshTokenGrantData.access_token, response);
        this._cookieService.writeRefreshCookie(newRefreshToken ?? refreshToken, response);
        this._cookieService.writeIdCookie(newIdToken ?? idToken, response);

        // Return an empty response to the browser
        response.setStatusCode(204);
    }

    /*
     * Return the logout URL and clear cookies
     */
    public async logout(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        request.getLogEntry().setOperationName('logout');
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the id token from the id cookie
        const idToken = this._cookieService.readIdCookie(request);
        if (!idToken) {
            throw ErrorUtils.fromMissingCookieError('id');
        }

        // Include the OAuth user id in API logs
        this._logUserId(request, idToken);

        // Clear all cookies for the caller
        this._cookieService.clearAll(response);

        // Write the full end session URL to the response body
        const data = {} as any;
        data.endSessionRequestUri = this._oauthService.getEndSessionRequestUri(idToken);
        response.setBody(data);
        response.setStatusCode(200);
    }

    /*
     * Make the refresh and / or the access token inside secure cookies act expired, for testing purposes
     */
    public async expire(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Get whether to expire the access or refresh token
        const type = request.getJsonField('type');
        const operation = type === 'access' ? 'expireAccessToken' : 'expireRefreshToken';

        // Check incoming details
        request.getLogEntry().setOperationName(operation);
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the current refresh token
        const accessToken = this._cookieService.readAccessCookie(request);
        if (!accessToken) {
            throw ErrorUtils.fromMissingCookieError('at');
        }

        // Get the current refresh token
        const refreshToken = this._cookieService.readRefreshCookie(request);
        if (!refreshToken) {
            throw ErrorUtils.fromMissingCookieError('rt');
        }

        // Get the id token from the id cookie
        const idToken = this._cookieService.readIdCookie(request);
        if (!idToken) {
            throw ErrorUtils.fromMissingCookieError('id');
        }

        // Include the OAuth user id in API logs
        this._logUserId(request, idToken);

        // Always make the access cookie act expired to cause an API 401
        const expiredAccessToken = `${accessToken}x`;
        this._cookieService.writeAccessCookie(expiredAccessToken, response);

        // If requested, make the refresh cookie act expired, to cause a permanent API 401
        if (type === 'refresh') {
            const expiredRefreshToken = `${refreshToken}x`;
            this._cookieService.writeRefreshCookie(expiredRefreshToken, response);
        }

        response.setStatusCode(204);
    }

    /*
     * Make sure there is a web origin, as supported by the 4 main browsers, and make sure it matches the expected value
     */
    private _validateOrigin(request: AbstractRequest): void {

        const origin = request.getHeader('origin');
        if (!origin) {
            throw ErrorUtils.fromMissingOriginError();
        }

        const found = this._apiConfiguration.trustedWebOrigins.find(o => o.toLowerCase() === origin.toLowerCase());
        if (!found) {
            throw ErrorUtils.fromUntrustedOriginError();
        }
    }

    /*
     * Extra cookies checks for data changing requests in line with OWASP
     */
    private _validateAntiForgeryCookie(request: AbstractRequest): void {

        // Get the cookie value
        const cookieValue = this._cookieService.readAntiForgeryCookie(request);
        if (!cookieValue) {
            throw ErrorUtils.fromMissingCookieError('csrf');
        }

        // Check the client has sent a matching anti forgery request header
        const headerName = this._cookieService.getAntiForgeryRequestHeaderName();
        const headerValue = request.getHeader(headerName);
        if (!headerValue) {
            throw ErrorUtils.fromMissingAntiForgeryTokenError();
        }

        // Check that the values match
        if (cookieValue !== headerValue) {
            throw ErrorUtils.fromMismatchedAntiForgeryTokenError();
        }
    }

    /*
     * Give the SPA the data it needs when it loads or the page is refreshed or a new browser tab is opened
     */
    private _handlePageLoad(request: AbstractRequest, response: AbstractResponse): void {

        // Inform the SPA that this is a normal page load and not a login response
        const pageLoadData = {
            handled: false,
        } as any;

        const existingIdToken = this._cookieService.readIdCookie(request);
        const antiForgeryToken = this._cookieService.readAntiForgeryCookie(request);
        if (existingIdToken && antiForgeryToken) {

            // Return data for the case where the user is already logged in
            pageLoadData.isLoggedIn = true;
            pageLoadData.antiForgeryToken = antiForgeryToken;
            this._logUserId(request, existingIdToken);

        } else {

            // Return data for the case where the user is not logged in
            pageLoadData.isLoggedIn = false;
        }

        response.setBody(pageLoadData);
    }

    /*
     * Add anti forgery details to the response after signing in
     */
    private _createAntiForgeryResponseData(request: AbstractRequest, response: AbstractResponse, data: any): void {

        // Get a random value
        const newCookieValue = this._cookieService.generateAntiForgeryValue();

        // Set an anti forgery HTTP Only encrypted cookie
        this._cookieService.writeAntiForgeryCookie(response, newCookieValue);

        // Also give the UI the anti forgery token in the response body
        data.antiForgeryToken = newCookieValue;
    }

    /*
     * Parse the id token then include the user id in logs
     */
    private _logUserId(request: AbstractRequest, idToken: string): void {

        const decoded = decode(idToken, {complete: true});
        if (decoded && decoded.payload.sub) {
            request.getLogEntry().setUserId(decoded.payload.sub as string);
        }
    }

    /*
     * Make the this parameter available for when the API is called
     */
    private _setupCallbacks(): void {
        this.startLogin = this.startLogin.bind(this);
        this.endLogin = this.endLogin.bind(this);
        this.refresh = this.refresh.bind(this);
        this.expire = this.expire.bind(this);
        this.logout = this.logout.bind(this);
    }
}
