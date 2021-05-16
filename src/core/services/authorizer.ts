import {Configuration} from '../configuration/configuration';
import {ErrorUtils} from '../errors/errorUtils';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';
import {Logger} from '../logging/logger';
import {UrlHelper} from '../utilities/urlHelper';
import {CookieService} from './cookieService';
import {OAuthService} from './oauthService';

/*
 * The entry point class for the OAuth Proxy API's logic
 */
export class Authorizer {

    private readonly _configuration: Configuration;
    private readonly _oauthService: OAuthService;
    private readonly _cookieService: CookieService;
    private readonly _logger: Logger;

    public constructor(
        configuration: Configuration,
        cookieService: CookieService,
        oauthService: OAuthService,
        logger: Logger) {

        this._configuration = configuration;
        this._cookieService = cookieService;
        this._oauthService = oauthService;
        this._logger = logger;
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

        // Next form the OpenID Connect authorization redirect URI
        let url = this._configuration.api.authorizeEndpoint;
        url += '?';
        url += UrlHelper.createQueryParameter('client_id', this._configuration.client.clientId);
        url += '&';
        url += UrlHelper.createQueryParameter('redirect_uri', this._configuration.client.redirectUri);
        url += '&';
        url += UrlHelper.createQueryParameter('response_type', 'code');
        url += '&';
        url += UrlHelper.createQueryParameter('scope', this._configuration.client.scope);
        url += '&';
        url += UrlHelper.createQueryParameter('state', loginState.state);
        url += '&';
        url += UrlHelper.createQueryParameter('code_challenge', loginState.codeChallenge);
        url += '&';
        url += UrlHelper.createQueryParameter('code_challenge_method', 'S256');

        // Write the full URL to the response body
        const data = {} as any;
        data.authorizationRequestUri = url;
        response.setBody(data);

        // Also write the state cookie to response headers
        const cookieData = {
            state: loginState.state,
            codeVerifier: loginState.codeVerifier,
        };
        this._cookieService.writeStateCookie(cookieData, response);
    }

    /*
     * Complete login by swapping the authorization code for tokens and writing them to cookies
     */
    public async endLogin(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        request.getLogEntry().setOperationName('endLogin');
        this._validateOrigin(request);

        // Read the state cookie and then clear it
        const stateCookie = this._cookieService.readStateCookie(request);
        if (!stateCookie) {
            throw ErrorUtils.fromMissingCookieError('No state cookie was found in the incoming request');
        }
        this._cookieService.clearStateCookie(response);

        // Check that the value posted matches
        const state = request.getJsonField('state');
        if (state !== stateCookie.state) {
            throw ErrorUtils.fromInvalidDataError(
                'The end login state parameter did not match the state cookie value');
        }

        // Get the code value
        const code = request.getJsonField('code');
        if (!code) {
            throw ErrorUtils.fromMissingFieldError('No code value was supplied in the endLogin request');
        }

        // Send the Authorization Code Grant message
        const authCodeGrantData = await this._oauthService.sendAuthorizationCodeGrant(code, stateCookie.codeVerifier);

        // Get the refresh token from the response
        const refreshToken = authCodeGrantData.refresh_token;
        if (!refreshToken) {
            throw ErrorUtils.fromMessage('No refresh token was received in the authorization code grant response');
        }

        // Get the id token from the response
        const idToken = authCodeGrantData.id_token;
        if (!idToken) {
            throw ErrorUtils.fromMessage('No id token was received in the authorization code grant response');
        }

        // Write both the refresh token and id token to HTTP only encrypted same site cookies
        this._cookieService.writeAuthCookie(refreshToken, response);
        this._cookieService.writeIdCookie(idToken, response);

        // Return a body consisting only of the anti forgery token
        const data = {} as any;
        this._addAntiForgeryResponseData(response, data);
        response.setBody(data);
    }

    /*
     * Return a new access token using the refresh token in the auth cookie
     */
    public async refreshToken(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        request.getLogEntry().setOperationName('refreshToken');
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the refresh token from the auth cookie
        const refreshToken = this._cookieService.readAuthCookie(request);
        if (!refreshToken) {
            throw ErrorUtils.fromMissingCookieError('No auth cookie was found in the incoming request');
        }

        // Get the id token from the id cookie
        const idToken = this._cookieService.readAuthCookie(request);
        if (!idToken) {
            throw ErrorUtils.fromMissingCookieError('No id cookie was found in the incoming request');
        }

        // Send the request to the Authorization Server
        const refreshTokenGrantData =
            await this._oauthService.sendRefreshTokenGrant(refreshToken);

        // Rewrite the refresh token cookie since we may have a new token
        const newRefreshToken = refreshTokenGrantData.refresh_token;
        this._cookieService.writeAuthCookie(newRefreshToken ?? refreshToken, response);

        // Rewrite the id token cookie since it may have changed
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
            throw ErrorUtils.fromMissingCookieError('No auth cookie was found in the incoming request');
        }

        // Write a corrupted refresh token to the cookie, which will fail on the next token renewal attempt
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
            throw ErrorUtils.fromMissingCookieError('No id cookie was found in the incoming request');
        }

        // Start the URL
        let url = this._configuration.api.endSessionEndpoint;
        url += '?';
        url += UrlHelper.createQueryParameter('client_id', this._configuration.client.clientId);
        url += '&';

        if (this._configuration.api.provider === 'cognito') {

            // Cognito has non standard parameters
            url += UrlHelper.createQueryParameter('logout_uri', this._configuration.client.postLogoutRedirectUri);

        } else {

            // For other providers supply the most standard values
            url += UrlHelper.createQueryParameter(
                'post_logout_redirect_uri',
                this._configuration.client.postLogoutRedirectUri);
            url += '&';
            url += UrlHelper.createQueryParameter('id_token_hint', idToken);
        }

        // Clear all cookies for the caller
        this._cookieService.clearAll(response);

        // Write the full URL to the response body
        const data = {} as any;
        data.endSessionRequestUri = url;
        response.setBody(data);
        response.setStatusCode(200);
    }

    /*
     * Make sure there is a web origin, as supported by the 4 main browsers, and make sure it matches the expected value
     */
    private _validateOrigin(request: AbstractRequest): void {

        const origin = request.getHeader('origin');
        if (!origin) {
            throw ErrorUtils.fromMissingFieldError('No origin header was supplied');
        }

        if (origin.toLowerCase() !== this._configuration.api.trustedWebOrigin.toLowerCase()) {
            throw ErrorUtils.fromInvalidDataError('The origin header contained an untrusted value');
        }
    }

    /*
     * Extra mitigation in the event of malicious code calling this API and implicitly sending the auth cookie
     */
    private _validateAntiForgeryCookie(request: AbstractRequest): void {

        // Get the cookie value
        const cookieValue = this._cookieService.readAntiForgeryCookie(request);
        if (!cookieValue) {
            throw ErrorUtils.fromMissingCookieError('No anti forgery cookie was found in the incoming request');
        }

        // Check the client has sent a matching anti forgery request header
        const headerName = this._cookieService.getAntiForgeryRequestHeaderName();
        const headerValue = request.getHeader(headerName);
        if (!headerValue) {
            throw ErrorUtils.fromMissingFieldError('No anti forgery request header field was supplied');
        }

        // Check that the values match
        if (cookieValue !== headerValue) {
            throw ErrorUtils.fromInvalidDataError(
                'The anti forgery request header does not match the anti forgery cookie value');
        }
    }

    /*
     * Add anti forgery details to the response when ending a login or when refreshing a token
     */
    private _addAntiForgeryResponseData(response: AbstractResponse, data: any): void {

        // Get a random value
        const randomValue = this._oauthService.generateAntiForgeryValue();

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
