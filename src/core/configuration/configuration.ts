/*
 * A holder for configuration settings
 */
export interface Configuration {

    name: string;

    clientId: string;

    redirectUri: string;

    tokenEndpoint: string;

    cookieRootDomain: string;

    cookieEncryptionKey: string;

    trustedWebOrigin: string;

    useMockResponses: boolean;
}
