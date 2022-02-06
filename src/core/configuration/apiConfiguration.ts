/*
 * Configuration for the API logic
 */
export interface ApiConfiguration {

    name: string;

    authorizeEndpoint: string;

    tokenEndpoint: string;

    endSessionEndpoint: string;

    cookieDomain: string,

    cookiePath: string,

    cookiePrefix: string,

    cookieEncryptionKey: string;

    trustedWebOrigins: string[];

    provider: string;

    mode: string;
}
