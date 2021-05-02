import cookie from 'cookie';
import {AbstractRequest} from '../../core/request/abstractRequest';

/*
 * Encapsulate the lambda request format
 */
export class LambdaRequest implements AbstractRequest {

    private readonly _event: any;
    private readonly _body: any;

    public constructor(event: any) {
        this._event = event;
        this._body = this._parseBody();
    }

    public getUri(): string {
        return this._event.path.toLowerCase();
    }

    public getMethod(): string {
        return this._event.httpMethod.toLowerCase();
    }

    public getBody(): any {
        return this._body;
    }

    /*
     * Read a single value header value
     */
    public getHeader(name: string): string | null {

        if (this._event.headers) {

            const found = Object.keys(this._event.headers).find((h) => h.toLowerCase() === name);
            if (found) {
                return this._event.headers[found];
            }
        }

        return null;
    }

    /*
     * Use a library to parse incoming cookies, which are generally received in multiple headers like this:
     * - Cookie: First=1; Second=2
     * - Cookie: Third=3
     */
    public getCookie(name: string): string | null {

        const headers = this._getMultiValueHeader('cookie');
        headers.forEach((h) => {

            const data = cookie.parse(h);
            if (data[name]) {
                return data[name];
            }
        });

        return null;
    }

    /*
     * Get a multi value header
     */
    private _getMultiValueHeader(name: string): string[] {

        if (this._event.headers) {

            const found = Object.keys(this._event.multiValueHeaders).find((h) => h.toLowerCase() === name);
            if (found) {
                return this._event.multiValueHeaders[found];
            }
        }

        return [];
    }

    /*
     * Parse the body string into an object
     */
    private _parseBody(): any {

        const body = this._event.body;
        if (!body) {
            return null;
        }

        const output: any = {};
        const formUrlEncodedData = body;

        // Split data such as 'grant_type=authorization_code&code=e7acecd0-6ec7-458b-b776-05a0757db30b' into fields
        const nameValuePairs = formUrlEncodedData.trim().split('&');

        // Add each field to the JSON object
        nameValuePairs.forEach((nameValuePair: string) => {
            const parts = nameValuePair.split('=');
            if (parts.length === 2) {
                output[parts[0].trim()] = decodeURIComponent(parts[1].trim());
            }
        });

        return output;
    }
}
