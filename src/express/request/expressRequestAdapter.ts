import {Request} from 'express';
import {AbstractRequest} from '../../core/request/abstractRequest';

/*
 * Adapt Express to our common base interface that also works for AWS Serverless
 */
export class ExpressRequestAdapter implements AbstractRequest {

    private readonly _request: Request;

    public constructor(request: Request) {
        this._request = request;
    }

    public getUri(): string {
        return this._request.path;
    }

    public getMethod(): string {
        return this._request.method;
    }

    public getFormField(name: string): string | null {
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
}
