/*
 * A list of API error codes
 */
export class ErrorCodes {

    // A generic server error
    public static readonly serverError = 'server_error';

    // A problem reading file data
    public static readonly fileReadError = 'file_read_error';

    // A problem making an HTTP request to the Authorization Server
    public static readonly httpRequestError = 'http_request_error';

    // A 401 error returned to clients with the front channel error details
    public static readonly loginResponseError = 'login_response_failed';

    // A 401 error returned to clients with the back channel error details
    public static readonly tokenResponseError = 'token_response_failed';

    // A generic 401 error returned to clients who send incorrect data
    public static readonly accessDeniedError = 'access_denied';

    // An untrusted browser origin called the token handler
    public static readonly untrustedWebOrigin = 'untrusted_web_origin';

    // An error to indicate a cookie not found, which could possibly be a browser issue
    public static readonly invalidStateError = 'invalid_state';

    // A request was received without the expected data
    public static readonly requestDataNotFoundError = 'request_data_not_found';

    // An error to indicate a cookie not found, which could possibly be a browser issue
    public static readonly cookieNotFoundError = 'cookie_not_found';

    // An error to indicate a cookie could not be decrypted, if for example it was truncated
    public static readonly cookieDecryptionError = 'cookie_decryption_error';

    // An error to indicate that the request header and secure cookie we both sent, but there was a mismatch
    public static readonly mismatchedAntiForgeryTokenError = 'mismatched_anti_forgery_token';
}
