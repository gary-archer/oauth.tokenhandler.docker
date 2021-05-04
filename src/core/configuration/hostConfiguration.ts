/*
 * Configuration for the host process
 */
export interface HostConfiguration {

    authorizeEndpoint: string;

    tokenEndpoint: string;

    cookieRootDomain: string,

    cookiePrefix: string,

    cookieEncryptionKey: string;

    trustedWebOrigin: string;

    provider: string;

    useMockResponses: boolean;
}
