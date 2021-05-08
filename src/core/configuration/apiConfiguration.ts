/*
 * Configuration for the API logic
 */
export interface ApiConfiguration {

    authorizeEndpoint: string;

    tokenEndpoint: string;

    cookieRootDomain: string,

    cookiePrefix: string,

    cookieEncryptionKey: string;

    trustedWebOrigin: string;

    provider: string;

    useMockResponses: boolean;
}
