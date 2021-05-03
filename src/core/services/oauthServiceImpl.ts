import axios, {AxiosRequestConfig} from 'axios';
import {randomBytes} from 'crypto';
import {URLSearchParams} from 'url';
import {HostConfiguration} from '../configuration/hostConfiguration';
import {ClientError} from '../errors/clientError';
import {ErrorHandler} from '../errors/errorHandler';
import {OAuthService} from './oauthService';
import {AbstractRequest} from '../request/abstractRequest';
import {AbstractResponse} from '../request/abstractResponse';

/*
 * A class to deal with calls to the Authorization Server and other OAuth responsibilities
 */
export class OAuthServiceImpl implements OAuthService {

    private readonly _tokenEndpoint: string;

    public constructor(configuration: HostConfiguration) {
        this._tokenEndpoint = configuration.tokenEndpoint;
    }

    /*
     * Forward the authorization code grant message to the Authorization Server
     */
    public async sendAuthorizationCodeGrant(request: AbstractRequest, response: AbstractResponse): Promise<any> {

        // Form the body of the authorization code grant message
        const formData = new URLSearchParams();
        const body = request.getBody();
        for (const field in body) {
            if (field && body[field]) {
                formData.append(field, body[field]);
            }
        }

        // Send an HTTP message and get the response, then add a field for anti forgery protection
        return this._postMessage(formData, response);
    }

    /*
     * Forward the refresh token grant message to the Authorization Server
     */
    public async sendRefreshTokenGrant(
        refreshToken: string,
        request: AbstractRequest,
        response: AbstractResponse): Promise<any>  {

        const formData = new URLSearchParams();
        const body = request.getBody();
        for (const field in body) {
            if (field && body[field]) {
                formData.append(field, body[field]);
            }
        }

        if (formData.has('refresh_token')) {
            formData.delete('refresh_token');
        }

        formData.append('refresh_token', refreshToken);
        return this._postMessage(formData, response);
    }

    /*
     * Generate a field used to protect the auth cookie
     */
    public generateAntiForgeryValue(): string {
        return randomBytes(32).toString('base64');
    }

    /*
     * Route a message to the Authorization Server
     */
    private async _postMessage(formData: URLSearchParams, response: AbstractResponse): Promise<void> {

        // Define request options
        const options = {
            url: this._tokenEndpoint,
            method: 'POST',
            data: formData,
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'accept': 'application/json',
            },
        };

        try {

            // Call the Authorization Server
            const authServerResponse = await axios.request(options as AxiosRequestConfig);

            // Update the response for the success case and return data
            response.setStatusCode(authServerResponse.status);
            return authServerResponse.data;

        } catch (e) {

            // Handle OAuth error responses
            if (e.response && e.response.status && e.response.data) {
                const errorData = e.response.data;
                if (errorData.error) {
                    const description = errorData.error_description ?? 'The Authorization Server rejected the request';
                    throw new ClientError(e.response.status, errorData.error, description);
                }
            }

            // Handle client connectivity errors
            throw ErrorHandler.fromHttpRequestError(e, options.url);
        }
    }
}
