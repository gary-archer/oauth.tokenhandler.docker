import {Configuration} from '../configuration/configuration';
import {ErrorHandler} from '../errors/errorHandler';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';
import {UrlHelper} from '../utilities/urlHelper';
import {CookieService} from './cookieService';
import {OAuthService} from './oauthService';

/*
 * The entry point for OAuth related operations
 */
export class Authorizer {

    private readonly _configuration: Configuration;
    private readonly _oauthService: OAuthService;
    private readonly _cookieService: CookieService;

    public constructor(configuration: Configuration, cookieService: CookieService, oauthService: OAuthService) {

        this._configuration = configuration;
        this._cookieService = cookieService;
        this._oauthService = oauthService;
    }

    /*
     * Calculate the authorization redirect URL and write a state cookie
     */
    public async startLogin(request: AbstractRequest, response: AbstractResponse): Promise<void> {

        // Check incoming details
        this._validateOrigin(request);

        // First create a random login state
        const loginState = this._oauthService.generateLoginState();

        // Next form the authorization redirect URI
        let url = this._configuration.api.authorizeEndpoint;
        url += '?';
        url += UrlHelper.queryParameter('client_id', this._configuration.client.clientId);
        url += '&';
        url += UrlHelper.queryParameter('redirect_uri', this._configuration.client.redirectUri);
        url += '&';
        url += UrlHelper.queryParameter('response_type', 'code');
        url += '&';
        url += UrlHelper.queryParameter('scope', this._configuration.client.scope);
        url += '&';
        url += UrlHelper.queryParameter('state', loginState.state);
        url += '&';
        url += UrlHelper.queryParameter('code_challenge', loginState.codeChallenge);
        url += '&';
        url += UrlHelper.queryParameter('code_challenge_method', 'S256');
        console.log(url);

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
        this._validateOrigin(request);

        // Ensure that the state query parameter matches that in the cookie and get the verifier
        const codeVerifier = this._validateStateCookie(request);

        // Send the authorization code grant request
        const authCodeGrantData = await this._oauthService.sendAuthorizationCodeGrant(request, response, codeVerifier);

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

        // Write the refresh token and id token to HTTP only encrypted same site cookies
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
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the refresh token from the auth cookie
        const refreshToken = this._cookieService.readAuthCookie(request);

        // Send it to the Authorization Server
        const refreshTokenGrantData =
            await this._oauthService.sendRefreshTokenGrant(refreshToken, request, response);

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
        this._validateOrigin(request);
        this._validateAntiForgeryCookie(request);

        // Get the current refresh token
        const refreshToken = this._cookieService.readAuthCookie(request);

        // Write a corrupted refresh token to the cookie, which will fail on the next token renewal attempt
        this._cookieService.expireAuthCookie(refreshToken, response);
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
        this._cookieService.clearAll(response);
        response.setStatusCode(204);
    }

    /*
     * If there is a web origin, make sure it matches the expected value
     */
    private _validateOrigin(request: AbstractRequest): void {

        const origin = request.getHeader('origin');
        if (!origin || origin.toLowerCase() !== this._configuration.api.trustedWebOrigin.toLowerCase()) {
            throw ErrorHandler.fromSecurityVerificationError(
                'The origin header was missing or contained an untrusted value');
        }
    }

    /*
     * Check that the state value in the authorization response matches that in the state cookie
     */
    private _validateStateCookie(request: AbstractRequest): string {

        const cookieData = this._cookieService.readStateCookie(request);
        const formData = request.getBody();

        if (cookieData.state !== formData.state) {
            throw ErrorHandler.fromSecurityVerificationError(
                'The state parameter to end the login did not match that in the state cooki');
        }

        return cookieData.codeVerifier;
    }

    /*
     * Extra mitigation in the event of malicious code calling this API and implicitly sending the auth cookie
     */
    private _validateAntiForgeryCookie(request: AbstractRequest): void {

        // Get the cookie value
        const cookieValue = this._cookieService.readAntiForgeryCookie(request);

        // Check there is a matching anti forgery token field
        const headerName = this._cookieService.getAntiForgeryRequestHeaderName();
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
