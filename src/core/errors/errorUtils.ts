import {ServerError} from './serverError';
import {ClientError} from './clientError';
import {ErrorCodes} from './errorCodes';

/*
 * Error utilities
 */
export class ErrorUtils {

    /*
     * Ensure that all errors are of a known type
     */
    public static fromException(exception: any): ServerError | ClientError {

        // Already handled 500 errors
        if (exception instanceof ServerError) {
            return exception;
        }

        // Already handled 4xx errors
        if (exception instanceof ClientError) {
            return exception;
        }

        return this.createServerError(exception);
    }

    /*
     * Create an error from an exception
     */
    public static createServerError(exception: any): ServerError {

        const error = new ServerError(
            ErrorCodes.serverError,
            'An unexpected exception occurred in the API',
            exception.stack);

        error.details = this._getExceptionDetails(exception);
        return error;
    }

    /*
     * Throw an API exception from a message
     */
    public static fromMessage(logContext: string): ServerError {

        const error = new ServerError(
            ErrorCodes.serverError,
            'An unexpected exception occurred in the API');

        error.details = logContext;
        return error;
    }

    /*
     * Throw an exception for the SPA when there is a login response error from the Authorization Server
     */
    public static fromLoginResponseError(errorCode: string, errorDescription: string): ClientError {

        let description = errorCode;
        if (errorDescription) {
            description += ` : ${errorDescription}`;
        }

        return new ClientError(400, ErrorCodes.loginResponseError, description);
    }

    /*
     * Indicate a cookie not sent, which could be a browser issue
     */
    public static fromMissingCookieError(name: string): ClientError {

        const error = new ClientError(
            400,
            ErrorCodes.invalidData,
            'A required cookie was missing in an incoming request');

        error.logContext = name;
        return error;
    }

    /*
     * Indicate an untrusted web origin
     */
    public static fromInvalidOriginError(): ClientError {

        const error = new ClientError(
            400,
            ErrorCodes.invalidData,
            'Request data was received with an invalid value');

        error.logContext = 'The origin header contained an untrusted value';
        return error;
    }

    /*
     * These occur if a form field or header was not supplied
     */
    public static fromMissingFieldError(name: string): ClientError {

        const error = new ClientError(
            400,
            ErrorCodes.invalidData,
            'A required field was missing in an incoming request');

        error.logContext = name;
        return error;
    }

    /*
     * This occurs if the state does not have the expected value
     */
    public static fromInvalidStateError(): ClientError {

        const error = new ClientError(
            400,
            ErrorCodes.invalidData,
            'Request data was received with an invalid value');

        error.logContext = 'The end login state parameter did not match the state cookie value';
        return error;
    }

    /*
     * This occurs if the anti forgery token does not have the expected value
     */
    public static fromInvalidAntiForgeryTokenError(): ClientError {

        const error = new ClientError(
            400,
            ErrorCodes.invalidData,
            'Request data was received with an invalid value');

        error.logContext = 'The anti forgery request header does not match the anti forgery cookie value';
        return error;
    }

    /*
     * Handle failed cookie decryption
     */
    public static fromCookieDecryptionError(name: string, exception: any): ClientError {

        const error = new ClientError(
            400,
            ErrorCodes.invalidData,
            'Request data was received with an invalid value');

        error.logContext = `${name}: ${this._getExceptionDetails(exception)}`;
        return error;
    }

    /*
     * Handle failed HTTP connectivity
     */
    public static fromHttpRequestError(exception: any, url: string): ServerError {

        const serverError = new ServerError(
            ErrorCodes.httpRequestError,
            'Problem encountered connecting to the Authorization Server',
            exception.stack);

        serverError.details = `${this._getExceptionDetails(exception)}, URL: ${url}`;
        return serverError;
    }

    /*
     * Get the message from an exception and avoid returning [object Object]
     */
    private static _getExceptionDetails(e: any): string {

        if (e.message) {
            return e.message;
        }

        const details = e.toString();
        if (details !== {}.toString()) {
            return details;
        }

        return '';
    }
}
