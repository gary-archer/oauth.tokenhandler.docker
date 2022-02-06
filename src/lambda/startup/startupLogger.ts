import {ErrorUtils} from '../../core/errors/errorUtils';
import {Logger} from '../../core/logging/logger';
import {LambdaResponse} from '../request/lambdaResponse';

export class StartupLogger {

    /*
     * Error handling and logging for startup errors
     */
    public static handleError(e: any, logger: Logger): any {

        // Initialise logging and create the log entry
        const logEntry = logger.createLogEntry();

        // Process error details
        const error = ErrorUtils.fromException(e);
        const clientError = logger.handleError(error, logEntry);

        // Add the error to logs
        const response = new LambdaResponse(logEntry);
        response.setError(clientError);
        response.finaliseLogs();
        logger.write(logEntry);

        // Return the response data
        return response.finaliseData();
    }
}