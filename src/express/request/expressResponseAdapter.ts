import {ClientError} from '../../core/errors/clientError';
import {AbstractResponse} from '../../core/request/abstractResponse';

/*
 * Adapt Express to our common base interface that also works for AWS Serverless
 */
export class ExpressResponseAdapter implements AbstractResponse {

    public setStatusCode(statusCode: number): void {
        throw new Error('Method not implemented.');
    }

    public addCookie(data: string): void {
        throw new Error('Method not implemented.');
    }

    public setBody(data: any): void {
        throw new Error('Method not implemented.');
    }

    public setError(error: ClientError): void {
        throw new Error('Method not implemented.');
    }

    public getData(statusCode: number): any {
        throw new Error('Method not implemented.');
    }
}
