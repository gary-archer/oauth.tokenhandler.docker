import {NextFunction, Request, Response} from 'express';
import {LogEntry} from './logEntry';

/*
 * The entry point for catching exceptions during API calls
 */
export class LoggerMiddleware {

    /*
     * Process any exceptions and add details to logs
     */
    public logRequest(request: Request, response: Response, next: NextFunction): void {
        
        const logEntry = new LogEntry();
        logEntry.start(request);
        response.locals.logEntry = logEntry;

        response.on('finish', () => {
            logEntry.end(response);
        });

        next();
    }
}
