import axios, {AxiosRequestConfig} from 'axios';
import {randomBytes} from 'crypto';
import {URLSearchParams} from 'url';
import {Configuration} from '../configuration/configuration';
import {ClientError} from '../errors/clientError';
import {ErrorHandler} from '../errors/errorHandler';
import {HttpProxy} from '../utilities/httpProxy';
import {OAuthLoginState} from '../utilities/oauthLoginState';

/*
 * A class to deal with calls to the Authorization Server and other OAuth responsibilities
 */
export class OAuthService {

    private readonly _configuration: Configuration;
    private readonly _httpProxy: HttpProxy;

    public constructor(configuration: Configuration, httpProxy: HttpProxy) {
        this._configuration = configuration;
        this._httpProxy = httpProxy;
    }

    /*
     * Generate values for the state cookie written before the authorization redirect
     */
    public generateLoginState(): OAuthLoginState {
        return new OAuthLoginState();
    }

    /*
     * Generate a field used to protect the auth cookie
     */
    public generateAntiForgeryValue(): string {
        return randomBytes(32).toString('base64');
    }

    /*
     * Send the authorization code grant message to the Authorization Server
     */
    public async sendAuthorizationCodeGrant(code: string, codeVerifier: string): Promise<any> {

        const formData = new URLSearchParams();
        formData.append('grant_type', 'authorization_code');
        formData.append('client_id', this._configuration.client.clientId);
        formData.append('code', code);
        formData.append('redirect_uri', this._configuration.client.redirectUri);
        formData.append('code_verifier', codeVerifier);
        return this._postGrantMessage(formData);
    }

    /*
     * Forward the refresh token grant message to the Authorization Server
     */
    public async sendRefreshTokenGrant(refreshToken: string): Promise<any>  {

        const formData = new URLSearchParams();
        formData.append('grant_type', 'refresh_token');
        formData.append('client_id', this._configuration.client.clientId);
        formData.append('refresh_token', refreshToken);
        return this._postGrantMessage(formData);
    }

    /*
     * Send a grant message to the Authorization Server
     */
    private async _postGrantMessage(formData: URLSearchParams): Promise<any> {

        // Define request options
        const options = {
            url: this._configuration.api.tokenEndpoint,
            method: 'POST',
            data: formData,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'accept': 'application/json',
            },
            httpsAgent: this._httpProxy.getAgent(),
        };

        try {

            // Call the Authorization Server and return the data
            const authServerResponse = await axios.request(options as AxiosRequestConfig);
            return authServerResponse.data;

        } catch (e) {

            // See if we have a response body
            if (e.response && e.response.status && e.response.data) {

                // Process error data and include the 'error' and 'error_description' fields
                const errorData = e.response.data;
                if (errorData.error) {

                    // Throw an error with Authorization Server details, such as invalid_grant
                    const description =
                        errorData.error_description ?? 'An error response was received from the Authorization Server';
                    throw new ClientError(e.response.status, errorData.error, description);
                }
            }

            // Throw a generic client connectivity error
            throw ErrorHandler.fromHttpRequestError(e, options.url);
        }
    }
}
