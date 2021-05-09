import {Configuration} from '../configuration/configuration';
import {ErrorHandler} from '../errors/errorHandler';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';
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

    public constructor(configuration: Configuration, cookieService: CookieService, oauthService: OAuthService) {

        this._configuration = configuration;
        this._cookieService = cookieService;
        this._oauthService = oauthService;
        this._setupCallbacks();
    }

    /*
     * Calculate the authorization redirect URL and write a state cookie
     */
    public async startLogin(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        console.log('API startLogin called ...');
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
        data['authorization_uri'] = url;
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
        console.log('API endLogin called ...');
        this._validateOrigin(request);

        // Read the state cookie
        const stateCookie = this._cookieService.readStateCookie(request);
        if (!stateCookie) {
            throw ErrorHandler.fromMissingCookieError('No state cookie was found in the incoming request');
        }

        // Check that the value posted matches
        const state = request.getFormField('state');
        if (state !== stateCookie.state) {
            throw ErrorHandler.fromInvalidDataError(
                'The end login state parameter did not match the state cookie value');
        }

        // Get the code value
        const code = request.getFormField('code');
        if (!code) {
            throw ErrorHandler.fromMissingFieldError('No code value was supplied in the endLogin request');
        }

        // Send the Authorization Code Grant message
        const authCodeGrantData = await this._oauthService.sendAuthorizationCodeGrant(code, stateCookie.codeVerifier);

        // Get the refresh token from the response
        const refreshToken = authCodeGrantData.refresh_token;
        if (!refreshToken) {
            throw ErrorHandler.fromMessage('No refresh token was received in the authorization code grant response');
        }

        // Get the id token from the response
        const idToken = authCodeGrantData.id_token;
        if (!idToken) {
            throw ErrorHandler.fromMessage('No id token was received in the authorization code grant response');
        }

        // Write both the refresh token and id token to HTTP only encrypted same site cookies
        this._cookieService.writeAuthCookie(refreshToken, response);
        this._cookieService.writeIdCookie(idToken, response);

        // Also write an anti forgery token into an encrypted HTTP only cookie
        const randomValue = this._oauthService.generateAntiForgeryValue();
        this._cookieService.writeAntiForgeryCookie(response, randomValue);

        // Also give the UI the anti forgery token in the response body
        const data = {} as any;
        data['anti_forgery_token'] = randomValue;
        response.setBody(data);
    }

    /*
     * Return a new access token using the refresh token in the auth cookie
     */
    public async refreshToken(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        console.log('API refreshToken called ...');
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the refresh token from the auth cookie
        const refreshToken = this._cookieService.readAuthCookie(request);
        if (!refreshToken) {
            throw ErrorHandler.fromMissingCookieError('No auth cookie was found in the incoming request');
        }

        // Send it to the Authorization Server
        const refreshTokenGrantData =
            await this._oauthService.sendRefreshTokenGrant(refreshToken);

        // Handle updated refresh tokens
        const newRefreshToken = refreshTokenGrantData.refresh_token;
        if (newRefreshToken) {
            this._cookieService.writeAuthCookie(newRefreshToken, response);
        }

        // Handle updated id tokens
        const newIdToken = refreshTokenGrantData.id_token;
        if (newIdToken) {
            this._cookieService.writeIdCookie(newIdToken, response);
        }

        // Write an updated anti forgery cookie
        const randomValue = this._oauthService.generateAntiForgeryValue();
        this._cookieService.writeAntiForgeryCookie(response, randomValue);

        // Return the access token and the anti forgery token in the response body
        const data = {} as any;
        data.access_token = refreshTokenGrantData.access_token;
        data['anti_forgery_token'] = randomValue;
        response.setBody(data);
    }

    /*
     * Make the refresh token act expired for test purposes
     */
    public async expireSession(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        console.log('API expireSession called ...');
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the current refresh token
        const refreshToken = this._cookieService.readAuthCookie(request);
        if (!refreshToken) {
            throw ErrorHandler.fromMissingCookieError('No auth cookie was found in the incoming request');
        }

        // Write a corrupted refresh token to the cookie, which will fail on the next token renewal attempt
        this._cookieService.expireAuthCookie(refreshToken, response);
        response.setStatusCode(204);
    }

    /*
     * Return the logout URL and clear auth cookies
     */
    public async startLogout(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        console.log('API startLogout called ...');
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Clear all cookies for this client
        this._cookieService.clearAll(response);
        response.setStatusCode(204);
    }

    /*
     * Make sure there is a web origin, as supported by the 4 main browsers, and make sure it matches the expected value
     */
    private _validateOrigin(request: AbstractRequest): void {

        const origin = request.getHeader('origin');
        if (!origin) {
            throw ErrorHandler.fromMissingFieldError('No origin header was supplied');
        }

        if (origin.toLowerCase() !== this._configuration.api.trustedWebOrigin.toLowerCase()) {
            throw ErrorHandler.fromInvalidDataError('The origin header contained an untrusted value');
        }
    }

    /*
     * Extra mitigation in the event of malicious code calling this API and implicitly sending the auth cookie
     */
    private _validateAntiForgeryCookie(request: AbstractRequest): void {

        // Get the cookie value
        const cookieValue = this._cookieService.readAntiForgeryCookie(request);
        if (!cookieValue) {
            throw ErrorHandler.fromMissingCookieError('No anti forgery cookie was found in the incoming request');
        }

        // Check the client has sent a matching anti forgery request header
        const headerName = this._cookieService.getAntiForgeryRequestHeaderName();
        const headerValue = request.getHeader(headerName);
        if (!headerValue) {
            throw ErrorHandler.fromMissingFieldError('No anti forgery request header field was supplied');
        }

        // Check that the values match
        if (cookieValue !== headerValue) {
            throw ErrorHandler.fromInvalidDataError(
                'The anti forgery request header does not match the anti forgery cookie value');
        }
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
