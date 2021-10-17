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
    private _isDeployed: boolean;
    private _prettyPrinting: boolean;
    private _apiName: string;

    /*
     * The logger is created during application startup
     */
    public constructor(isLambda: boolean) {
        this._isLambda = isLambda;
        this._isDeployed = false;
        this._prettyPrinting = false;
        this._apiName = 'TokenHandlerApi';
    }

    /*
     * Initialise once the configuration file is loaded
     */
    public initialise(configuration: ApiConfiguration): void {
        this._isDeployed = configuration.isDeployed;
        this._prettyPrinting = configuration.prettyPrinting;
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
            logEntry.setClientError(clientError);
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

        const dataToLog = this._formatData(logEntry);
        if (this._isLambda) {

            if (this._isDeployed) {

                // Ensure that Cloudwatch logs use a bare format
                this._logToConsoleRaw(dataToLog);

            } else {

                // During lambda development write logs to a local file to avoid conflicting with the lambda response
                this._logToFile(dataToLog);
            }

        } else {

            // When using Express we log to stdout, and deployed systems use a bare format to support log shipping
            this._logToConsole(dataToLog);
        }
    }

    /*
     * Use prettified output for development to improve readability
     * Use a single line per JSON object for deployed systems, as expected by log shipper tools
     */
    private _formatData(logEntry: LogEntry): string {

        if (this._prettyPrinting) {
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
     * In AWS Cloudwatch we use bare JSON logging that will work best with log shippers
     * Note that the format remains readable in the Cloudwatch console
     */
    private _logToConsoleRaw(data: string) {
        process.stdout.write(data + '\n');
    }

    /*
     * Write to file in order to prevent mixing logs with lambda responses on a developer PC
     * This is not efficient but is only used when 'sls invoke local -f' is used during development
     */
    private _logToFile(data: string): void {
        fs.appendFileSync('./.logs/api.log', data);
    }
}
