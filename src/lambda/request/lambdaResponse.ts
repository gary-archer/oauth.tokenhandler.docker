import {ClientError} from '../../core/errors/clientError';
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

    public addCookie(data: string): void {
        const cookies = this._getCookieHeader();
        cookies.push(data);
    }

    public setBody(data: any): void {
        this._data.body = data;
        this._setJson();
    }

    public setError(error: ClientError): void {
        this._data.statusCode = error.statusCode;
        this._data.body = error.toResponseFormat();
        this._setJson();
    }

    public getData(): any {

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

    private _setJson(): void {
        this.addHeader('content-type', 'application/json');
    }

    private _getCookieHeader(): string[] {

        const found = Object.keys(this._data.multiValueHeaders).find((k) => k.toLowerCase() === 'set-cookie');
        if (found) {
            return this._data.multiValueHeaders[found];
        }

        const cookies: string[] = [];
        this._data.multiValueHeaders['set-cookie'] = cookies;
        return cookies;
    }
}
