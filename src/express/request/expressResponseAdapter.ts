import {CookieSerializeOptions} from 'cookie';
import {Response} from 'express';
import {ClientError} from '../../core/errors/clientError';
import {AbstractResponse} from '../../core/request/abstractResponse';

/*
 * Adapt Express to our common base interface that also works for AWS Serverless
 */
export class ExpressResponseAdapter implements AbstractResponse {

    private readonly _response: Response;
    private _data: any;

    public constructor(response: Response) {
        this._response = response;
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
        this._data = error;
    }

    public finalise(): any {

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
