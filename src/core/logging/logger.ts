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

    private readonly _isLambda: boolean;
    private _isDevelopment: boolean;

    /*
     * The logger is created during application startup
     */
    public constructor(isLambda: boolean) {
        this._isLambda = isLambda;
        this._isDevelopment = true;
    }

    /*
     * Initialise once the configuration file is loaded
     */
    public initialise(configuration: ApiConfiguration): void {
        this._isDevelopment = configuration.development;
    }

    /*
     * Startup errors do not have a request object
     */
    public handleStartupError(exception: any): void {

        const logEntry = new LogEntry();
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
            logEntry.setClientError(clientError);
            return clientError;

        } else {

            // API errors mean we experienced a failure
            const serverError = handledError as ServerError;
            logEntry.setServerError(serverError);
            return serverError.toClientError();
        }
    }

    /*
     * Output the log entry
     */
    public write(logEntry: LogEntry): void {

        const dataToLog = this._formatData(logEntry);
        if (this._isLambda && this._isDevelopment) {

            this._logToFile(dataToLog);

        } else {

            this._logToConsole(dataToLog);
        }
    }

    /*
     * Use prettified output for development to improve readability
     * Use a single line per JSON object for deployed systems, as expected by log shipper tools
     */
    private _formatData(logEntry: LogEntry): string {

        if (this._isDevelopment) {
            return JSON.stringify(logEntry.getData(), null, 2);
        } else {
            return JSON.stringify(logEntry.getData());
        }
    }

    /*
     * Write to stdout
     */
    private _logToConsole(data: string) {
        console.log(data);
    }

    /*
     * Write to file in order to prevent mixing logs with lambda responses on a developer PC
     * This is not efficient but is only used when 'sls invoke local -f' is used during development
     */
    private _logToFile(data: string): void {
        fs.appendFileSync('./logs/api.log', data);
    }
}
