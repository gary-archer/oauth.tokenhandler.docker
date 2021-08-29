/*
 * Our client error format consists of an error and error_description
 */
export class ClientError extends Error {

    // Fields in all client errors
    private readonly _statusCode: number;
    private readonly _errorCode: string;
    private _logContext: string;

    // Extra fields for 500 errors
    private _area: string;
    private _id: number;
    private _utcTime: string;

    public constructor(statusCode: number, errorCode: string, message: string) {

        // Set 4xx fields
        super(message);
        this._statusCode = statusCode;
        this._errorCode = errorCode;
        this._logContext = '';

        // Initialise 5xx fields
        this._area = '';
        this._id = 0;
        this._utcTime = '';

        // Ensure that instanceof works
        Object.setPrototypeOf(this, new.target.prototype);
    }

    public get errorCode(): string {
        return this._errorCode;
    }

    public get statusCode(): number {
        return this._statusCode;
    }

    public set logContext(value: string) {
        this._logContext = value;
    }

    /*
     * Set extra fields to return to the caller for 500 errors
     */
    public setExceptionDetails(area: string, id: number, utcTime: string): void {
        this._area = area;
        this._id = id;
        this._utcTime = utcTime;
    }

    /*
     * Return an object that can be serialized by calling JSON.stringify
     */
    public toResponseFormat(): any {

        const body: any = {
            code: this._errorCode,
            message: this.message,
        };

        if (this._id > 0 && this._area.length > 0 && this._utcTime.length > 0) {
            body.id = this._id;
            body.area = this._area;
            body.utcTime = this._utcTime;
        }

        return body;
    }

    /*
     * Similar to the above but includes details outside the response body
     */
    public toLogFormat(): any {

        const data: any = {
            statusCode: this._statusCode,
            clientError: this.toResponseFormat(),
        };

        if (this._logContext) {
            data.context = this._logContext;
        }

        return data;
    }
}
