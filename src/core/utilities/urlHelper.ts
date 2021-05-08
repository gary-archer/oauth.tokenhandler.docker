/*
 * URL utilities
 */
export class UrlHelper {

    /*
     * Return URL encoded query parameters
     */
    public static queryParameter(key: string, value: string): string {
        return `${key}=${encodeURIComponent(value)}`;
    }
}
