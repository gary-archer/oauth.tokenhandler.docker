import {ServerError} from '../errors/serverError';
import {ClientError} from '../errors/clientError';

/*
 * Each API operation has a log entry, to support structured logging
 */
export class LogEntry {

    private readonly _data: any;

    public constructor() {
        this._data = {};
        this._data.apiName = 'oauthproxyapi';
    }

    public setOperationName(operationName: string): void {
        this._data.operationName = operationName;
    }

    public setServerError(error: ServerError): void {
        this._data.errorData = error.toLogFormat();
    }

    public setClientError(error: ClientError): void {
        this._data.errorData = error.toLogFormat();
    }

    public setStatusCode(statusCode: number): void {
        this._data.statusCode = statusCode;
    }

    public getData(): any {
        return this._data;
    }
}
