/*
 * Configuration for the host details of the API
 */
export interface HostConfiguration {

    // The port to listen on
    port: number;

    // The path to the SSL certificate P12 file
    sslCertificateFileName: string;

    // The SSL certificate's private key password
    sslCertificatePassword: string;

    // Whether to use an HTTPS proxy
    useProxy: boolean;

    // The proxy URL when used
    proxyUrl: string;
}
