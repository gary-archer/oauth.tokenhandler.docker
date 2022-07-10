/*
 * Most 4xx errors from the Authorization Server are returned as 4xx errors and the UI displays an error
 * Typically these will represent a configuration error that the SPA cannot fix
 * For expiry related errors return 401 so that the UI can try a renewal action and avoid a user error display
 */
export class OAuthErrorStatus {

    /*
     * A login with prompt=none could return login_required as an expiry error
     */
    public static fromAuthorizationResponseError(errorCode: string): number {

        if (errorCode === 'login_required') {
            return 401;
        }

        return 400;
    }

    /*
     * Refresh token expiry is expected and we return 401 in this case
     */
    public static fromTokenResponseError(grantType: string, statusCode: number, errorCode: string): number {

        if (statusCode >= 400 && statusCode < 500) {

            if (grantType === 'refresh_token' && errorCode === 'invalid_grant') {
                return 401;
            }

            return 400;
        }

        return statusCode;
    }
}
