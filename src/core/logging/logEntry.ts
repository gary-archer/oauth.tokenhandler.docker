import {Guid} from 'guid-typescript';
import {ServerError} from '../errors/serverError';
import {ClientError} from '../errors/clientError';
import {LogEntryData} from './logEntryData';

/*
 * Each API operation has a log entry, to support structured logging
 */
export class LogEntry {

    private readonly _data: LogEntryData;

    public constructor(apiName: string) {
        this._data = new LogEntryData(apiName);
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

        this._data.performance.start();
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

    public setUserId(userId: string): void {
        this._data.userOAuthId = userId;
    }

    public setServerError(error: ServerError): void {

        this._data.errorData = error.toLogFormat(this._data.apiName);
        console.error(this._data.errorData);
        this._data.errorCode = error.errorCode;
        this._data.errorId = error.getInstanceId();
    }

    public setClientError(error: ClientError): void {

        this._data.errorData = error.toLogFormat();
        this._data.errorCode = error.errorCode;
    }

    public end(statusCode: number): void {

        this._data.performance.dispose();
        this._data.millisecondsTaken = this._data.performance.millisecondsTaken;
        this._data.statusCode = statusCode;
    }

    public getData(): any {
        return this._data.toLogFormat();
    }
}
