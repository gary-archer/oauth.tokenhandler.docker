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

    // No origin header was supplied
    public static readonly missingWebOrigin = 'missing_web_origin';

    // An untrusted browser origin called the token handler
    public static readonly untrustedWebOrigin = 'untrusted_web_origin';

    // An error to indicate a cookie not found, which could possibly be a browser issue
    public static readonly invalidStateError = 'invalid_state';

    // An error to indicate a cookie not found, which could possibly be a browser issue
    public static readonly cookieNotFoundError = 'cookie_not_found';

    // An error to indicate a cookie could not be decrypted, if for example it was truncated
    public static readonly cookieDecryptionError = 'cookie_decryption_error';

    // An error to indicate that the request header was missing
    public static readonly missingAntiForgeryTokenError = 'missing_csrf_token';

    // An error to indicate that the request header and secure cookie do not match
    public static readonly mismatchedAntiForgeryTokenError = 'mismatched_csrf_token';

    // An error to indicate that a required form field was not found
    public static readonly formFieldNotFoundError = 'form_field_not_found';
}
