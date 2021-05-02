import {ClientError} from '../errors/clientError';

/*
 * An abstraction to represent an outgoing HTTP response, that works for both AWS lambda and Express
 */
export interface AbstractResponse {

    setStatusCode(statusCode: number): void;

    addCookie(data: string): void;

    setBody(data: any): void;

    setError(error: ClientError): void;

    getPayload(statusCode: number): any;
}
