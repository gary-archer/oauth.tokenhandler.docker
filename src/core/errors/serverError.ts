import {ClientError} from './clientError';

/*
 * An error entity that the API will log
 */
export class ServerError extends Error {

    private _statusCode: number;
    private _errorCode: string;
    private _url: any;
    private _details: any;

    /*
     * Errors are categorized by error code
     */
    public constructor(errorCode: string, userMessage: string, stack?: string | undefined) {

        super(userMessage);

        // Give fields their default values
        this._statusCode = 500;
        this._errorCode = errorCode;
        this._url = '';
        this._details = '';

        // Record the stack trace of the original error
        if (stack) {
            this.stack = stack;
        }

        // Ensure that instanceof works
        Object.setPrototypeOf(this, new.target.prototype);
    }

    public get errorCode(): any {
        return this._errorCode;
    }

    public get url(): any {
        return this._url;
    }

    public set url(url: any) {
        this._url = url;
    }

    public set statusCode(statusCode: any) {
        this._statusCode = statusCode;
    }

    public get details(): any {
        return this._details;
    }

    public set details(details: any) {
        this._details = details;
    }

    /*
     * Return an object ready to log, including the stack trace
     */
    public toLogFormat(): any {

        const serviceError: any = {
        };

        if (this.url) {
            serviceError.url =  this._url;
        }
        if (this.details) {
            serviceError.details =  this._details;
        }

        // Include the stack trace as an array within the JSON object
        if (this.stack) {

            const frames: string[] = [];
            const items = this.stack.split('\n').map((x: string) => x.trim());
            items.forEach((i) => {
                frames.push(i);
            });

            serviceError.stack = frames;
        }

        return {
            statusCode: this._statusCode,
            clientError: this.toClientError().toResponseFormat(),
            serviceError,
        };
    }

    /*
     * Translate to the OAuth response format of an error and error_description
     */
    public toClientError(): ClientError {
        return new ClientError(this._statusCode, this._errorCode, this.message);
    }
}
