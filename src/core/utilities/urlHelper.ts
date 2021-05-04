/*
 * URL utilities
 */
export class UrlHelper {

    /*
     * Return URL encoded query parameters
     */
    public static queryParameter(key: string, value: string) {
        return `${key}=${encodeURIComponent(value)}`;
    }
}
