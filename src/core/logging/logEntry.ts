import {Guid} from 'guid-typescript';
import os from 'os';
import {ServerError} from '../errors/serverError';
import {ClientError} from '../errors/clientError';

/*
 * Each API operation has a log entry, to support structured logging
 */
export class LogEntry {

    private readonly _data: any;

    public constructor() {

        this._data = {
            id: Guid.create().toString(),
            utcTime: new Date().toISOString(),
            apiName: 'oauthproxyapi',
            hostName: os.hostname(),
            performanceThreshold: 500,
        };
    }

    /*
     * Default log data when logging begins
     */
    public start(
        method: string,
        path: string,
        clientApplicationName: string | null,
        correlationId: string | null,
        sessionId: string | null): void {

        this._data.requestVerb = method;
        this._data.requestPath = path;

        // Our callers can supply a custom header so that we can keep track of who is calling each API
        if (clientApplicationName) {
            this._data.clientApplicationName = clientApplicationName;
        }

        // Use the correlation id from request headers or create a new one
        this._data.correlationId = correlationId ? correlationId : Guid.create().toString();

        // Log an optional session id if supplied
        if (sessionId) {
            this._data.sessionId = sessionId;
        }
    }

    public setOperationName(operationName: string): void {
        this._data.operationName = operationName;
    }

    public setServerError(error: ServerError): void {
        this._data.errorData = error.toLogFormat();
        this._data.errorCode = error.errorCode;
    }

    public setClientError(error: ClientError): void {
        this._data.errorData = error.toLogFormat();
        this._data.errorCode = error.errorCode;
    }

    public end(statusCode: number): void {
        this._data.statusCode = statusCode;
    }

    public getData(): any {
        return this._data;
    }
}
