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

        error.details = {
            message: this._getExceptionDetails(exception),
        };

        return error;
    }

    /*
     * If a completely unexpected condition occurs, throw an API exception from the supplied message
     */
    public static createGenericError(message: string): ServerError {

        const error = new ServerError(
            ErrorCodes.serverError,
            'An unexpected exception occurred in the API');

        error.details = {
            message,
        };

        return error;
    }

    /*
     * Throw an exception for the SPA when there is a login response error from the Authorization Server
     */
    public static fromLoginResponseError(errorCode: string, errorDescription: string | null): ClientError {

        const description = errorDescription || 'A login error response was received from the Authorization Server';
        return new ClientError(401, errorCode, description);
    }

    /*
     * Throw an exception for the SPA when there is a back channel response error from the Authorization Server
     */
    public static fromTokenResponseError(errorCode: string, errorDescription: string | null, url: string): ClientError {

        const description = errorDescription || 'A token error response was received from the Authorization Server';

        const error = new ClientError(401, errorCode, description);
        error.logContext = {
            url,
        };

        return error;
    }

    /*
     * All standards based browsers should send an origin header
     */
    public static fromMissingOriginError(): ClientError {

        const error = ErrorUtils._createGeneric401Error();
        error.logContext = {
            code: ErrorCodes.missingWebOrigin,
        };

        return error;
    }

    /*
     * Indicate an untrusted web origin
     */
    public static fromUntrustedOriginError(): ClientError {

        const error = ErrorUtils._createGeneric401Error();
        error.logContext = {
            code: ErrorCodes.untrustedWebOrigin,
        };

        return error;
    }

    /*
     * Indicate a cookie not sent, which could be a browser issue
     */
    public static fromMissingCookieError(name: string): ClientError {

        const error = ErrorUtils._createGeneric401Error();
        error.logContext = {
            code: ErrorCodes.cookieNotFoundError,
            name,
        };

        return error;
    }

    /*
     * This occurs if the state does not have the expected value
     */
    public static fromInvalidStateError(): ClientError {

        const error = ErrorUtils._createGeneric401Error();
        error.logContext = {
            code: ErrorCodes.invalidStateError,
        };

        return error;
    }

    /*
     * This occurs if the anti forgery token was not provided
     */
    public static fromMissingAntiForgeryTokenError(): ClientError {

        const error = ErrorUtils._createGeneric401Error();
        error.logContext = {
            code: ErrorCodes.missingAntiForgeryTokenError,
        };

        return error;
    }

    /*
     * This occurs if the anti forgery token does not have the expected value
     */
    public static fromMismatchedAntiForgeryTokenError(): ClientError {

        const error = ErrorUtils._createGeneric401Error();
        error.logContext = {
            code: ErrorCodes.mismatchedAntiForgeryTokenError,
        };

        return error;
    }

    /*
     * This occurs if a required field was not found in a form post
     */
    public static fromFormFieldNotFoundError(name: string): ClientError {

        const error = ErrorUtils._createGeneric401Error();
        error.logContext = {
            code: ErrorCodes.formFieldNotFoundError,
            name,
        };

        return error;
    }

    /*
     * Handle failed cookie decryption
     */
    public static fromMalformedCookieError(name: string, message: string): ClientError {

        const error = ErrorUtils._createGeneric401Error();
        error.logContext = {
            code: ErrorCodes.cookieDecryptionError,
            name,
            details: `Invalid cookie received, name: ${name}, details: ${message}`,
        };

        return error;
    }

    /*
     * Handle failed cookie decryption
     */
    public static fromCookieDecryptionError(name: string, exception: any): ClientError {

        const error = ErrorUtils._createGeneric401Error();
        error.logContext = {
            code: ErrorCodes.cookieDecryptionError,
            name,
            details: this._getExceptionDetails(exception),
        };

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

        serverError.details = {
            message: `${this._getExceptionDetails(exception)}, URL: ${url}`,
        };
        return serverError;
    }

    /*
     * In many cases we avoid giving away security details by returning this error while logging more useful details
     */
    private static _createGeneric401Error(): ClientError {

        return new ClientError(
            401,
            ErrorCodes.accessDeniedError,
            'Access was denied due to invalid request details');
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
