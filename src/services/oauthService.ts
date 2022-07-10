import axios, {AxiosRequestConfig} from 'axios';
import {URLSearchParams} from 'url';
import {ApiConfiguration} from '../configuration/apiConfiguration';
import {ClientConfiguration} from '../configuration/clientConfiguration';
import {ErrorUtils} from '../errors/errorUtils';
import {OAuthErrorStatus} from '../errors/oauthErrorStatus';
import {HttpProxy} from '../utilities/httpProxy';
import {OAuthLoginState} from '../utilities/oauthLoginState';
import {UrlHelper} from '../utilities/urlHelper';

/*
 * A class to deal with calls to the Authorization Server and other OAuth responsibilities
 */
export class OAuthService {

    private readonly _apiConfiguration: ApiConfiguration;
    private readonly _clientConfiguration: ClientConfiguration;
    private readonly _httpProxy: HttpProxy;

    public constructor(
        apiConfiguration: ApiConfiguration,
        clientConfiguration: ClientConfiguration,
        httpProxy: HttpProxy) {

        this._apiConfiguration = apiConfiguration;
        this._clientConfiguration = clientConfiguration;
        this._httpProxy = httpProxy;
    }

    /*
     * Generate values for the state cookie written before the authorization redirect
     */
    public generateLoginState(): OAuthLoginState {
        return new OAuthLoginState();
    }

    /*
     * Form the OpenID Connect authorization request URL
     */
    public getAuthorizationRequestUri(loginState: OAuthLoginState): string {

        let url = this._apiConfiguration.authorizeEndpoint;
        url += '?';
        url += UrlHelper.createQueryParameter('client_id', this._clientConfiguration.clientId);
        url += '&';
        url += UrlHelper.createQueryParameter('redirect_uri', this._clientConfiguration.redirectUri);
        url += '&';
        url += UrlHelper.createQueryParameter('response_type', 'code');
        url += '&';
        url += UrlHelper.createQueryParameter('scope', this._clientConfiguration.scope);
        url += '&';
        url += UrlHelper.createQueryParameter('state', loginState.state);
        url += '&';
        url += UrlHelper.createQueryParameter('code_challenge', loginState.codeChallenge);
        url += '&';
        url += UrlHelper.createQueryParameter('code_challenge_method', 'S256');
        return url;
    }

    /*
     * Send the authorization code grant message to the Authorization Server
     */
    public async sendAuthorizationCodeGrant(code: string, codeVerifier: string): Promise<any> {

        const formData = new URLSearchParams();
        formData.append('grant_type', 'authorization_code');
        formData.append('client_id', this._clientConfiguration.clientId);
        formData.append('client_secret', this._clientConfiguration.clientSecret);
        formData.append('code', code);
        formData.append('redirect_uri', this._clientConfiguration.redirectUri);
        formData.append('code_verifier', codeVerifier);
        return this._postGrantMessage('authorization_code', formData);
    }

    /*
     * Forward the refresh token grant message to the Authorization Server
     */
    public async sendRefreshTokenGrant(refreshToken: string): Promise<any>  {

        const formData = new URLSearchParams();
        formData.append('grant_type', 'refresh_token');
        formData.append('client_id', this._clientConfiguration.clientId);
        formData.append('client_secret', this._clientConfiguration.clientSecret);
        formData.append('refresh_token', refreshToken);
        return this._postGrantMessage('refresh_token', formData);
    }

    /*
     * Create the OpenID Connect end session request URL
     */
    public getEndSessionRequestUri(idToken: string): string {

        // Start the URL
        let url = this._apiConfiguration.endSessionEndpoint;
        url += '?';
        url += UrlHelper.createQueryParameter('client_id', this._clientConfiguration.clientId);
        url += '&';

        if (this._apiConfiguration.provider === 'cognito') {

            // Cognito has non standard parameters
            url += UrlHelper.createQueryParameter('logout_uri', this._clientConfiguration.postLogoutRedirectUri);

        } else {

            // For other providers supply the most standard values
            url += UrlHelper.createQueryParameter(
                'post_logout_redirect_uri',
                this._clientConfiguration.postLogoutRedirectUri);
            url += '&';
            url += UrlHelper.createQueryParameter('id_token_hint', idToken);
        }

        return url;
    }

    /*
     * Send a grant message to the Authorization Server
     */
    private async _postGrantMessage(grantType: string, formData: URLSearchParams): Promise<any> {

        // Define request options
        const options = {
            url: this._apiConfiguration.tokenEndpoint,
            method: 'POST',
            data: formData,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'accept': 'application/json',
            },
            httpsAgent: this._httpProxy.agent,
        };

        try {

            // Call the Authorization Server and return the data
            const authServerResponse = await axios.request(options as AxiosRequestConfig);
            return authServerResponse.data;

        } catch (e: any) {

            // See if we have a response body
            if (e.response && e.response.status && e.response.data) {

                // Process error data and include the 'error' and 'error_description' fields
                const errorData = e.response.data;
                if (errorData.error) {

                    // Throw an error with Authorization Server details
                    const statusCode = OAuthErrorStatus.fromTokenResponseError(
                        grantType,
                        e.response.status,
                        errorData.error);

                    throw ErrorUtils.fromTokenResponseError(
                        statusCode,
                        errorData.error,
                        errorData.error_description,
                        options.url);
                }
            }

            // Throw a generic client connectivity error
            throw ErrorUtils.fromHttpRequestError(e, options.url);
        }
    }
}
