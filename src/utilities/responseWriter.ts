import {Response} from 'express';

/*
 * Helper methods to write the response
 */
export class ResponseWriter {

    /*
     * Return data to the caller, which could be a success or error object
     */
    public static write(response: Response, statusCode: number, data: any): void {

        response.setHeader('Content-Type', 'application/json');
        response.status(statusCode)

        if (data) {
            response.send(JSON.stringify(data));
        } else {
            response.send();
        }
    }
}
