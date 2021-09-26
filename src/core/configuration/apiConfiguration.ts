/*
 * Configuration for the API logic
 */
export interface ApiConfiguration {

    name: string;

    authorizeEndpoint: string;

    tokenEndpoint: string;

    endSessionEndpoint: string;

    cookieDomain: string,

    cookiePrefix: string,

    cookieEncryptionKey: string;

    trustedWebOrigin: string;

    provider: string;

    isDeployed: boolean;

    prettyPrinting: boolean;
}
