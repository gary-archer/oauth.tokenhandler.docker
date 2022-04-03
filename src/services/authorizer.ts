import base64url from 'base64url';
import {Request, Response} from 'express';
import {ApiConfiguration} from '../configuration/apiConfiguration';
import {ErrorUtils} from '../errors/errorUtils';
import {LogEntry} from '../logging/logEntry';
import {HeaderProcessor} from '../utilities/headerProcessor';
import {PageLoadResponse} from '../utilities/pageLoadResponse';
import {ResponseWriter} from '../utilities/responseWriter';
import {UrlHelper} from '../utilities/urlHelper';
import {CookieService} from './cookieService';
import {OAuthService} from './oauthService';

/*
 * The entry point class for the OAuth Agent's logic, which performs an outline of processing
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
    public async startLogin(request: Request, response: Response): Promise<void> {

        // Check incoming details
        this._getLogEntry(response).setOperationName('startLogin');
        this._validateOrigin(request);

        // First create a random login state
        const loginState = this._oauthService.generateLoginState();

        // Write a temporary state cookie
        const cookieData = {
            state: loginState.state,
            codeVerifier: loginState.codeVerifier,
        };
        this._cookieService.writeStateCookie(cookieData, response);

        // Write the response body
        const body = {
            authorizationRequestUri: this._oauthService.getAuthorizationRequestUri(loginState),
        };
        ResponseWriter.write(response, 200, body);
    }

    /*
     * The SPA sends us the full URL when the page loads, and it may contain an authorization result
     * Complete login if required, by swapping the authorization code for tokens and storing tokens in secure cookies
     */
    public async endLogin(request: Request, response: Response): Promise<void> {

        // First do basic validation
        this._getLogEntry(response).setOperationName('endLogin');
        this._validateOrigin(request);

        // Get the URL posted by the SPA
        const url = request.body['url'];
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
            const body = this._handlePageLoad(request, response);
            ResponseWriter.write(response, 200, body);
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
        this._logUserId(response, idToken);

        // Write tokens to separate HTTP only encrypted same site cookies
        this._cookieService.writeRefreshCookie(refreshToken, response);
        this._cookieService.writeAccessCookie(accessToken, response);
        this._cookieService.writeIdCookie(idToken, response);

        // Inform the SPA that that a login response was handled
        const endLoginData = {
            isLoggedIn: true,
            handled: true,
        } as PageLoadResponse;

        // Create an anti forgery cookie which will last for the duration of the multi tab browsing session
        this._createAntiForgeryResponseData(request, response, endLoginData);
        ResponseWriter.write(response, 200, endLoginData);
    }

    /*
     * Write a new access token into the access token cookie
     */
    public async refresh(request: Request, response: Response): Promise<void> {

        // Check incoming details
        this._getLogEntry(response).setOperationName('refresh');
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
        this._logUserId(response, idToken);

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
        ResponseWriter.write(response, 204, null);
    }

    /*
     * Return the logout URL and clear cookies
     */
    public async logout(request: Request, response: Response): Promise<void> {

        // Check incoming details
        this._getLogEntry(response).setOperationName('logout');
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the id token from the id cookie
        const idToken = this._cookieService.readIdCookie(request);
        if (!idToken) {
            throw ErrorUtils.fromMissingCookieError('id');
        }

        // Include the OAuth user id in API logs
        this._logUserId(response, idToken);

        // Clear all cookies for the caller
        this._cookieService.clearAll(response);

        // Return the full end session URL
        const data = {
            endSessionRequestUri: this._oauthService.getEndSessionRequestUri(idToken),
        };
        ResponseWriter.write(response, 200, data);
    }

    /*
     * Make the refresh and / or the access token inside secure cookies act expired, for testing purposes
     */
    public async expire(request: Request, response: Response): Promise<void> {

        // Get whether to expire the access or refresh token
        const type = request.body['type'];
        const operation = type === 'access' ? 'expireAccessToken' : 'expireRefreshToken';

        // Check incoming details
        this._getLogEntry(response).setOperationName(operation);
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
        this._logUserId(response, idToken);

        // Always make the access cookie act expired to cause an API 401
        const expiredAccessToken = `${accessToken}x`;
        this._cookieService.writeAccessCookie(expiredAccessToken, response);

        // If requested, make the refresh cookie act expired, to cause a permanent API 401
        if (type === 'refresh') {
            const expiredRefreshToken = `${refreshToken}x`;
            this._cookieService.writeRefreshCookie(expiredRefreshToken, response);
        }

        // Return an empty response to the browser
        ResponseWriter.write(response, 204, null);
    }

    /*
     * Make sure there is a web origin, as supported by the 4 main browsers, and make sure it matches the expected value
     */
    private _validateOrigin(request: Request): void {

        const origin = HeaderProcessor.getHeader(request, 'origin');
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
    private _validateAntiForgeryCookie(request: Request): void {

        // Get the cookie value
        const cookieValue = this._cookieService.readAntiForgeryCookie(request);
        if (!cookieValue) {
            throw ErrorUtils.fromMissingCookieError('csrf');
        }

        // Check the client has sent a matching anti forgery request header
        const headerName = this._cookieService.getAntiForgeryRequestHeaderName();
        const headerValue = HeaderProcessor.getHeader(request, headerName);
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
    private _handlePageLoad(request: Request, response: Response): PageLoadResponse {

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
            this._logUserId(response, existingIdToken);

        } else {

            // Return data for the case where the user is not logged in
            pageLoadData.isLoggedIn = false;
        }

        return pageLoadData;
    }

    /*
     * Add anti forgery details to the response after signing in
     */
    private _createAntiForgeryResponseData(request: Request, response: Response, data: any): void {

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
    private _logUserId(response: Response, idToken: string): void {

        const parts = idToken.split('.');
        if (parts.length === 3) {

            const payload = base64url.decode(parts[1]);
            if (payload) {
                const claims = JSON.parse(payload);
                if (claims.sub) {
                    this._getLogEntry(response).setUserId(claims.sub);
                }
            }
        }
    }

    /*
     * Get the current log entry
     */
    private _getLogEntry(response: Response) {
        return response.locals.logEntry as LogEntry;
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
