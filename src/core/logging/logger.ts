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

        this._isDevelopment = configuration.development;
        if (this._isDevelopment && this._isLambda) {

            this._innerLogger = this._createLogger(this._getFileTransport());

        } else {

            this._innerLogger = this._createLogger(this._getConsoleTransport());
        }
    }

    /*
     * Output the log entry
     */
    public write(logEntry: LogEntry): void {

        // Make sure we have a logger, and for startup errors we create the logger here
        if (!this._innerLogger) {
            this._innerLogger = this._createLogger(this._getConsoleTransport());
        }

        // Then send the data to winston
        this._innerLogger.info(logEntry.getData());
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

    /*
     * Log to stdout for deployed systems and during local Express development
     */
    private _getConsoleTransport(): winston.transport {

        const transport = new winston.transports.Console();
        transport.format = this._isDevelopment ? this._getPrettyJsonFormatter() : this._getBareJsonFormatter();
        return transport;
    }

    /*
     * During local lambda development we log to logs/api.log and the console shows the lambda response
     */
    private _getFileTransport(): winston.transport {

        const fileOptions = {
            dirname: 'logs',
            filename: 'api.log',
        };

        const transport = new winston.transports.File(fileOptions);
        transport.format = this._getPrettyJsonFormatter();
        return transport;
    }

    /*
     * Get winston to print a JSON object per line, used by log shipping tools
     */
    private _getBareJsonFormatter(): winston.Logform.Format {

        return winston.format.combine(
            winston.format.printf((data: any) => {
                return JSON.stringify(data.message);
            })
        );
    }

    /*
     * Get winston to print a multi line JSON for best readability during development
     */
    private _getPrettyJsonFormatter(): winston.Logform.Format {

        return winston.format.combine(
            winston.format.printf((data: any) => {
                return JSON.stringify(data.message, null, 2);
            })
        );
    }
}
