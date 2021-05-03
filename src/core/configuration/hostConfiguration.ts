/*
 * Configuration for the host process
 */
export interface HostConfiguration {

    tokenEndpoint: string;

    cookieRootDomain: string,

    cookiePrefix: string,

    cookieEncryptionKey: string;

    trustedWebOrigin: string;

    provider: string;

    useMockResponses: boolean;
}
