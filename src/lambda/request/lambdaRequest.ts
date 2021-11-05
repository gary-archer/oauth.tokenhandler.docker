import {APIGatewayProxyEvent} from 'aws-lambda';
import cookie from 'cookie';
import {LogEntry} from '../../core/logging/logEntry';
import {AbstractRequest} from '../../core/request/abstractRequest';

/*
 * Encapsulate the lambda request format
 */
export class LambdaRequest implements AbstractRequest {

    private readonly _event: APIGatewayProxyEvent;
    private readonly _body: any;
    private readonly _logEntry: LogEntry;

    public constructor(event: APIGatewayProxyEvent, logEntry: LogEntry) {

        this._event = event;
        this._body = this._event.body ? JSON.parse(this._event.body) : {};

        this._logEntry = logEntry;
        this._logEntry.start(
            this.getMethod(),
            this.getUri(),
            this.getHeader('x-mycompany-api-client'),
            this.getHeader('x-mycompany-correlation-id'),
            this.getHeader('x-mycompany-session-id'));
    }

    public getUri(): string {
        return this._event.path.toLowerCase();
    }

    public getMethod(): string {
        return this._event.httpMethod;
    }

    public getJsonField(name: string): string | null {
        return this._body[name];
    }

    /*
     * Read a single value header value
     */
    public getHeader(name: string): string | null {

        if (this._event.headers) {

            const found = Object.keys(this._event.headers).find((h) => h.toLowerCase() === name);
            if (found) {
                return this._event.headers[found] as string;
            }
        }

        return null;
    }

    public getCookie(name: string): string | null {

        let result = '';
        const headers = this._getMultiValueHeader('cookie');
        headers.forEach((h) => {

            const data = cookie.parse(h);
            if (data[name]) {
                result = data[name];
            }
        });

        return result;
    }

    public getLogEntry(): LogEntry {
        return this._logEntry;
    }

    private _getMultiValueHeader(name: string): string[] {

        if (this._event.multiValueHeaders) {

            const found = Object.keys(this._event.multiValueHeaders).find((h) => h.toLowerCase() === name);
            if (found) {
                return this._event.multiValueHeaders[found] as string[];
            }
        }

        return [];
    }
}
