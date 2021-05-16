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
     * These can occur in normal usage if a new browser session is started
     * We return the standard invalid_grant error code which our SPA checks for
     */
    public static fromMissingCookieError(logContext: string): ClientError {

        const error = new ClientError(
            400,
            ErrorCodes.cookieNotFound,
            'A required cookie was missing in an incoming request');

        error.logContext = logContext;
        return error;
    }

    /*
     * These occur if a form field or header was not supplied
     */
    public static fromMissingFieldError(logContext: string): ClientError {

        const error = new ClientError(
            400,
            ErrorCodes.fieldNotFound,
            'A required field was missing in an incoming request');

        error.logContext = logContext;
        return error;
    }

    /*
     * These occur if a form field or header was supplied but with an invalid value
     */
    public static fromInvalidDataError(logContext: string): ClientError {

        const error = new ClientError(
            400,
            ErrorCodes.invalidData,
            'Request data was received with an invalid value');

        error.logContext = logContext;
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

        error.logContext = this._getExceptionDetails(exception);
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
