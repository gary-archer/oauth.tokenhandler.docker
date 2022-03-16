import {Request} from 'express';
import {LogEntry} from '../../core/logging/logEntry';
import {AbstractRequest} from '../../core/request/abstractRequest';

/*
 * Adapt Express to our common base interface
 */
export class ExpressRequestAdapter implements AbstractRequest {

    private readonly _request: Request;
    private readonly _logEntry: LogEntry;

    public constructor(request: Request, logEntry: LogEntry) {

        this._request = request;
        this._logEntry = logEntry;

        this._logEntry.start(
            this.getMethod(),
            this.getUri(),
            this.getHeader('x-mycompany-api-client'),
            this.getHeader('x-mycompany-correlation-id'),
            this.getHeader('x-mycompany-session-id'));
    }

    public getUri(): string {
        return this._request.path;
    }

    public getMethod(): string {
        return this._request.method;
    }

    public getJsonField(name: string): string | null {
        return this._request.body[name];
    }

    public getHeader(name: string): string | null {

        if (this._request.headers) {
            const found = this._request.headers[name];
            if (found) {

                if (Array.isArray(found)) {
                    return found[0];
                }

                return found;
            }
        }

        return null;
    }

    public getCookie(name: string): string | null {
        return this._request.cookies[name];
    }

    public getLogEntry(): LogEntry {
        return this._logEntry;
    }
}
