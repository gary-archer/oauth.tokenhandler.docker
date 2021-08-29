/*
 * A list of API error codes
 */
export class ErrorCodes {

    // A generic server error
    public static readonly serverError = 'server_error';

    // A problem reading file data
    public static readonly fileReadError = 'file_read_error';

    // An error to indicate a cookie not found, which could possibly be a browser issue
    public static readonly cookieNotFound = 'cookie_not_found';

    // An error to represent a login response failure
    public static readonly loginResponseError = 'login_response_failed';

    // A generic error to indicate data not found
    public static readonly invalidData = 'invalid_data';

    // A problem making an HTTP request to the Authorization Server
    public static readonly httpRequestError = 'http_request_error';
}
