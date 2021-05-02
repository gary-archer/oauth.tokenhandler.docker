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
     * Get a single value header
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
     * Get a multi value header
     */
    public getMultiValueHeader(name: string): string[] {

        const values: string[] = [];

        // Iterate headers, which is an object with header names as keys, each of which have a key and value
        if (this._event.headers) {
            for (const key in this._event.headers) {
                if (key && key === name) {

                    // Add each item to results
                    this._event.headers[key].forEach((i: any) => {
                        values.push(i.value);
                    });
                }
            }
        }

        return values;
    }

    /*
     * Parse incoming cookies, which could be received in multiple strings
     * - Cookie: First=1; Second=2
     * - Cookie: Third=3
     */
    public getCookie(name: string): string | null {

        let result = null;

        // Look for all incoming cookie headers
        const headers = this.getMultiValueHeader('cookie');
        headers.forEach((h) => {

            // Use a library to parse the cookie text
            const data = cookie.parse(h);
            if (data[name]) {
                result = data[name];
            }
        });

        return result;
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
