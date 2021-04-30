/*
 * A holder for configuration settings
 */
export interface Configuration {

    tokenEndpoint: string;

    cookieRootDomain: string;

    cookieEncryptionKey: string;

    trustedWebOrigin: string;

    useMockResponses: boolean;
}
