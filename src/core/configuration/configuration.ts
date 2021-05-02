/*
 * A holder for configuration settings
 */
export interface Configuration {

    clientId: string;

    tokenEndpoint: string;

    cookieRootDomain: string;

    cookieEncryptionKey: string;

    trustedWebOrigin: string;

    useMockResponses: boolean;
}
