import {Request, Response} from 'express';
import {Guid} from 'guid-typescript';
import {ServerError} from '../errors/serverError';
import {ClientError} from '../errors/clientError';
import {HeaderProcessor} from '../utilities/headerProcessor';
import {LogEntryData} from './logEntryData';

/*
 * Each API operation has a log entry, to support structured logging
 */
export class LogEntry {

    private readonly _data: LogEntryData;
    private readonly _prettyPrint: boolean;

    public constructor(prettyPrint: boolean) {
        this._data = new LogEntryData();
        this._prettyPrint = prettyPrint;
    }

    public start(request: Request): void {

        // Start the log entry
        this._data.performance.start();
        this._data.method = request.method;
        this._data.path = request.originalUrl;

        // Get custom headers if sent
        const clientApplicationName = HeaderProcessor.getHeader(request, 'x-mycompany-api-client');
        const correlationId = HeaderProcessor.getHeader(request, 'x-mycompany-correlation-id');
        const sessionId = HeaderProcessor.getHeader(request, 'x-mycompany-session-id');

        // Keep track of which component is calling each API
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
        this._data.userId = userId;
    }

    public setServerError(error: ServerError): void {

        this._data.errorData = error.toLogFormat();
        this._data.errorCode = error.errorCode;
        this._data.errorId = error.getInstanceId();
    }

    public setClientError(error: ClientError): void {

        this._data.errorData = error.toLogFormat();
        this._data.errorCode = error.errorCode;
    }

    public setErrorCodeOverride(code: string): void {
        this._data.errorCode = code;
    }

    public end(response: Response): void {

        this._data.performance.dispose();
        this._data.millisecondsTaken = this._data.performance.millisecondsTaken;
        this._data.statusCode = response.statusCode;
        this._output();
    }

    public writeStartupError(e: ServerError): void {
        this.setServerError(e);
        this._data.statusCode = 500;
        this._output();
    }

    private _output(): void {

        const data = this._data.toLogFormat();
        if (this._prettyPrint) {

            // During Express development use pretty printing
            console.log(JSON.stringify(data, null, 2));

        } else {

            // In Kubernetes use bare JSON logging
            console.log(JSON.stringify(data));
        }
    }
}
