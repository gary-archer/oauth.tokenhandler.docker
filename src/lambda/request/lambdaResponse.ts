import cookie, {CookieSerializeOptions} from 'cookie';
import {ClientError} from '../../core/errors/clientError';
import {LogEntry} from '../../core/logging/logEntry';
import {AbstractResponse} from '../../core/request/abstractResponse';

/*
 * Encapsulate the lambda response format
 */
export class LambdaResponse implements AbstractResponse {

    private readonly _data: any;

    public constructor() {
        this._data = {};
        this._data.statusCode = 200;
        this._data.headers = {};
        this._data.multiValueHeaders = {};
    }

    public setStatusCode(statusCode: number): void {
        this._data.statusCode = statusCode;
    }

    public addHeader(name: string, value: string): void {
        this._data.headers[name] = value;
    }

    public addCookie(name: string, value: string, options: CookieSerializeOptions): void {

        const data = cookie.serialize(name, value, options);
        this._createCookieMultiValueHeader().push(data);
    }

    public setBody(data: any): void {
        this._setJsonContentType();
        this._data.body = data;
    }

    public setError(error: ClientError): void {
        this._data.statusCode = error.statusCode;
        this._setJsonContentType();
        this._data.body = error.toResponseFormat();
    }

    public finalise(logEntry: LogEntry): any {

        logEntry.setStatusCode(this._data.statusCode);

        const data = {
            statusCode : this._data.statusCode,
        } as any;

        if (Object.keys(this._data.headers).length > 0) {
            data.headers = this._data.headers;
        }

        if (Object.keys(this._data.multiValueHeaders).length > 0) {
            data.multiValueHeaders = this._data.multiValueHeaders;
        }

        if (this._data.body) {
            data.body = JSON.stringify(this._data.body);
        }

        return data;
    }

    private _setJsonContentType(): void {
        this.addHeader('content-type', 'application/json');
    }

    private _createCookieMultiValueHeader(): string[] {

        const found = Object.keys(this._data.multiValueHeaders).find((k) => k.toLowerCase() === 'set-cookie');
        if (found) {
            return this._data.multiValueHeaders[found];
        }

        const cookies: string[] = [];
        this._data.multiValueHeaders['set-cookie'] = cookies;
        return cookies;
    }
}
