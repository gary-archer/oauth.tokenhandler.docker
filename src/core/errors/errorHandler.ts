import {ApiError} from './apiError';
import {ClientError} from './clientError';
import {ErrorCodes} from './errorCodes';
import {Logger} from '../utilities/logger';

/*
 * A class to handle composing and reporting errors
 */
export class ErrorHandler {

    /*
     * Handle the server error and get client details
     */
    public static handleError(exception: any): ClientError {

        // Ensure that the exception has a known type
        const handledError = ErrorHandler.fromException(exception);
        if (exception instanceof ClientError) {

            // Client errors mean the caller did something wrong
            const clientError = handledError as ClientError;

            // Log the error
            const errorToLog = clientError.toLogFormat();
            Logger.error(errorToLog);

            // Return the API response to the caller
            return clientError;

        } else {

            // API errors mean we experienced a failure
            const apiError = handledError as ApiError;

            // Log the error with an id
            const errorToLog = apiError.toLogFormat();
            Logger.error(errorToLog);

            // Return the API response to the caller
            return apiError.toClientError();
        }
    }

    /*
     * Ensure that all errors are of a known type
     */
    public static fromException(exception: any): ApiError | ClientError {

        // Already handled 500 errors
        if (exception instanceof ApiError) {
            return exception;
        }

        // Already handled 4xx errors
        if (exception instanceof ClientError) {
            return exception;
        }

        // Handle general exceptions
        const apiError = new ApiError(
            ErrorCodes.serverError,
            'An unexpected exception occurred in the API',
            exception.stack);

        apiError.details = this._getExceptionDetails(exception);
        return apiError;
    }

    /*
     * Throw an API exception from a message
     */
    public static fromMessage(logContext: string): ApiError {

        const apiError = new ApiError(
            ErrorCodes.serverError,
            'An unexpected exception occurred in the API');

        apiError.details = logContext;
        return apiError;
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
    public static fromCookieDecryptionError(name: string, exception: any): ApiError {

        const apiError = new ApiError(
            ErrorCodes.invalidData,
            'Request data was received with an invalid value',
            exception.stack);

        apiError.statusCode = 400;
        apiError.details = {
            name,
            details: this._getExceptionDetails(exception),
        };

        return apiError;
    }

    /*
     * Handle failed HTTP connectivity
     */
    public static fromHttpRequestError(exception: any, url: string): ApiError {

        const apiError = new ApiError(
            ErrorCodes.httpRequestError,
            'Problem encountered connecting to the Authorization Server',
            exception.stack);

        apiError.url = url;
        apiError.details = this._getExceptionDetails(exception);
        return apiError;
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
