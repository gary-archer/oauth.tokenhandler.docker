import {CookieSerializeOptions} from 'cookie';
import {Response} from 'express';
import {ClientError} from '../../core/errors/clientError';
import {LogEntry} from '../../core/logging/logEntry';
import {AbstractResponse} from '../../core/request/abstractResponse';

/*
 * Adapt Express to our common base interface
 */
export class ExpressResponseAdapter implements AbstractResponse {

    private readonly _response: Response;
    private readonly _logEntry: LogEntry;
    private _data: any;

    public constructor(response: Response, logEntry: LogEntry) {
        this._response = response;
        this._logEntry = logEntry;
        this._data = null;
    }

    public setStatusCode(statusCode: number): void {
        this._response.status(statusCode);
    }

    public addCookie(name: string, value: string, options: CookieSerializeOptions): void {
        this._response.cookie(name, value, options);
    }

    public setBody(data: any): void {
        this._setJsonContentType();
        this._data = data;
    }

    public setError(error: ClientError): void {
        this.setStatusCode(error.statusCode);
        this._setJsonContentType();
        this._data = error.toResponseFormat();
    }

    public finaliseLogs(): void {
        this._logEntry.end(this._response.statusCode);
    }

    public finaliseData(): any {

        if (this._data) {
            this._response.send(this._data);
        } else {
            this._response.send();
        }

        return null;
    }

    private _setJsonContentType(): void {
        this._response.setHeader('content-type', 'application/json');
    }
}
