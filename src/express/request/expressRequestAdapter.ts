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
        throw new Error('Method not implemented.');
    }

    public getMethod(): string {
        throw new Error('Method not implemented.');
    }

    public getBody(): any {
        throw new Error('Method not implemented.');
    }

    public getHeader(name: string): string | null {
        throw new Error('Method not implemented.');
    }

    public getCookie(name: string): string | null {
        throw new Error('Method not implemented.');
    }
}
