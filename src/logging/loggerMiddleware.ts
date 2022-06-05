import {NextFunction, Request, Response} from 'express';
import { ApiConfiguration } from '../configuration/apiConfiguration';
import {LogEntry} from './logEntry';

/*
 * The entry point for catching exceptions during API calls
 */
export class LoggerMiddleware {

    private readonly _configuration: ApiConfiguration;

    public constructor(configuration: ApiConfiguration) {
        this._configuration = configuration;
        this._setupCallbacks();
    }

    /*
     * Process any exceptions and add details to logs
     */
    public logRequest(request: Request, response: Response, next: NextFunction): void {

        const logEntry = new LogEntry(this._configuration.prettyPrintLogs);
        logEntry.start(request);
        response.locals.logEntry = logEntry;

        response.on('finish', () => {
            logEntry.end(response);
        });

        next();
    }

    /*
     * Make the this parameter available for when the API is called
     */
    private _setupCallbacks(): void {
        this.logRequest = this.logRequest.bind(this);
    }
}
