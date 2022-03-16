import {CookieSerializeOptions} from 'cookie';
import {ClientError} from '../errors/clientError';

/*
 * An abstraction to represent an outgoing HTTP response
 */
export interface AbstractResponse {

    setStatusCode(statusCode: number): void;

    addCookie(name: string, value: string, options: CookieSerializeOptions): void;

    setBody(data: any): void;

    setError(error: ClientError): void;

    finaliseLogs(): void;

    finaliseData(): any;
}
