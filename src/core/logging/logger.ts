import winston from 'winston';
import {ApiConfiguration} from '../configuration/apiConfiguration';
import {LogEntry} from './logEntry';

/*
 * A simple logging class for our API's use cases
 */
export class Logger {

    private readonly _isLambda: boolean;
    private _isDevelopment: boolean;
    private _innerLogger: any = null;

    /*
     * The logger is created during application startup
     */
    public constructor(isLambda: boolean) {
        this._isLambda = isLambda;
        this._isDevelopment = false;
    }

    /*
     * The inner logger is created once configuration is loaded
     */
    public initialize(configuration: ApiConfiguration): void {

        if (configuration.development && this._isLambda) {
            this._innerLogger = this._createLogger(this._getFileTransport());
        } else {
            this._innerLogger = this._createLogger(this._getConsoleTransport());
        }
    }

    /*
     * Output the log entry and use pretty printing during development
     */
    public write(logEntry: LogEntry): void {

        // For startup errors create the logger here
        if (!this._innerLogger) {
            this._innerLogger = this._createLogger(this._getConsoleTransport());
        }

        if (this._isDevelopment) {

            // Use readable logs when debugging
            this._innerLogger.info(JSON.stringify(logEntry.getData(), null, 2));

        } else {

            // Use logs that can be easily shipped to Elastic Search
            this._innerLogger.info(JSON.stringify(logEntry.getData()));
        }
    }

    /*
     * Log to stdout for deployed systems and during local Express development
     */
    private _getConsoleTransport(): winston.transport {

        const consoleOptions = {
            format: winston.format.combine(
                winston.format.simple(),
            ),
        };

        return new (winston.transports.Console)(consoleOptions);
    }

    /*
     * During local lambda development we log to logs/api.log and the console shows the lambda response
     */
    private _getFileTransport(): winston.transport {

        const fileOptions = {
            dirname: 'logs',
            filename: 'api.log',
        };

        return new (winston.transports.File)(fileOptions);
    }

    /*
     * Create the logger with a single transport and JSON logging for this sample does not use log levels
     */
    private _createLogger(transport: winston.transport): winston.Logger {

        return winston.createLogger({
            level: 'info',
            transports: [
                transport
            ],
        });
    }
}
