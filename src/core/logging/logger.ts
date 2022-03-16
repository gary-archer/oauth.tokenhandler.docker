import fs from 'fs-extra';
import {ApiConfiguration} from '../configuration/apiConfiguration';
import {ServerError} from '../errors/serverError';
import {ClientError} from '../errors/clientError';
import {ErrorUtils} from '../errors/errorUtils';
import {LogEntry} from './logEntry';

/*
 * A simple logging class for our API's use cases
 */
export class Logger {

    private _apiName: string;

    /*
     * The logger is created during application startup
     */
    public constructor() {
        this._apiName = 'OAuthAgentApi';
    }

    /*
     * Initialise once the configuration file is loaded
     */
    public initialise(configuration: ApiConfiguration): void {
        this._apiName = configuration.name;
    }

    /*
     * The logger creates log entries
     */
    public createLogEntry(): LogEntry {
        return new LogEntry(this._apiName);
    }

    /*
     * Startup errors do not have a request object
     */
    public handleStartupError(exception: any): void {

        const logEntry = this.createLogEntry();
        logEntry.setServerError(ErrorUtils.createServerError(exception));
        this.write(logEntry);
    }

    /*
     * Handle errors during API calls
     */
    public handleError(exception: any, logEntry: LogEntry): ClientError {

        const handledError = ErrorUtils.fromException(exception);
        if (exception instanceof ClientError) {

            // Client errors mean the caller did something wrong
            const clientError = handledError as ClientError;

            // Record details in logs as a child object
            logEntry.setClientError(clientError);

            // In some cases we return a generic error code to the client and log a more specific one
            if (clientError.logContext && clientError.logContext.code) {
                logEntry.setErrorCodeOverride(clientError.logContext.code);
            }

            return clientError;

        } else {

            // API errors mean we experienced a failure
            const serverError = handledError as ServerError;
            logEntry.setServerError(serverError);
            return serverError.toClientError(this._apiName);
        }
    }

    /*
     * Output the log entry
     */
    public write(logEntry: LogEntry): void {

        if (process.env.IS_LOCAL) {

            // During Express development use pretty printing
            const data = JSON.stringify(logEntry.getData(), null, 2);
            console.log(data);

        } else {

            // In Kubernetes use bare JSON logging
            const data = JSON.stringify(logEntry.getData());
            console.log(data);
        }
    }
}
