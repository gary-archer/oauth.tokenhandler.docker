import {Logger} from '../logging/logger';
import {ApiError} from './apiError';
import {ClientError} from './clientError';
import {ErrorUtils} from './errorUtils';

/*
 * A class for handling exceptions and adding them to logs
 */
export class ExceptionHandler {

    private readonly _logger: Logger;

    public constructor(logger: Logger) {
        this._logger = logger;
    }

    /*
     * Handle the server error and get client details
     */
    public handleError(exception: any): ClientError {

        // Ensure that the exception has a known type
        const handledError = ErrorUtils.fromException(exception);
        if (exception instanceof ClientError) {

            // Client errors mean the caller did something wrong
            const clientError = handledError as ClientError;

            // Log the error
            const errorToLog = clientError.toLogFormat();
            this._logger.error(errorToLog);

            // Return the API response to the caller
            return clientError;

        } else {

            // API errors mean we experienced a failure
            const apiError = handledError as ApiError;

            // Log the error with an id
            const errorToLog = apiError.toLogFormat();
            this._logger.error(errorToLog);

            // Return the API response to the caller
            return apiError.toClientError();
        }
    }
}
