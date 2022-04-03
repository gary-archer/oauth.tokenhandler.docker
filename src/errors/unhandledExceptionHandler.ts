import {Response} from 'express';
import {ClientError} from '../errors/clientError';
import {ErrorUtils} from '../errors/errorUtils';
import {ServerError} from '../errors/serverError';
import {LogEntry} from '../logging/logEntry';

/*
 * The entry point for unhandled exceptions
 */
export class UnhandledExceptionHandler {

   /*
     * Handle the server error and return client details
     */
   public static handleError(exception: any, response: Response): ClientError {

        const handledError = ErrorUtils.fromException(exception);
        if (exception instanceof ClientError) {

            const clientError = handledError as ClientError;
            const logEntry = response.locals.logEntry as LogEntry;
            if (clientError.logContext && clientError.logContext.code) {
                logEntry.setErrorCodeOverride(clientError.logContext.code);
            }
            
            logEntry.setClientError(clientError);
            return clientError;

        } else {

            const serverError = handledError as ServerError;
            const logEntry = response.locals.logEntry as LogEntry;
            logEntry.setServerError(serverError);
            return serverError.toClientError();
        }
    }
}
