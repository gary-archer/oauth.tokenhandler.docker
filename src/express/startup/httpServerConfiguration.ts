import {Application} from 'express';
import fs from 'fs-extra';
import https from 'https';
import {Configuration} from '../../core/configuration/configuration';
import {Authorizer} from '../../core/services/authorizer';
import {CookieService} from '../../core/services/cookieService';
import {OAuthService} from '../../core/services/oauthService';
import {HttpProxy} from '../../core/utilities/httpProxy';

/*
 * Configure Express API behaviour
 */
export class HttpServerConfiguration {

    private readonly _expressApp: Application;
    private readonly _configuration: Configuration;
    private readonly _authorizer: Authorizer;

    /*
     * Auto wire the main aithorizer class, which is the entry point for processing
     */
    public constructor(expressApp: Application, configuration: Configuration, httpProxy: HttpProxy) {

        this._expressApp = expressApp;
        this._configuration = configuration;
        
        this._authorizer = new Authorizer(
            this._configuration,
            new CookieService(configuration),
            new OAuthService(configuration.api, httpProxy));
    }

    /*
     * Set up routes for the API's OAuth operations
     */
    public async initializeRoutes(): Promise<void> {
    }

    /*
     * Start listening for requests
     */
    public async startListening(): Promise<void> {

        if (this._configuration.host.sslCertificateFileName && this._configuration.host.sslCertificatePassword) {

            // Load certificate details
            const pfxFile = await fs.readFile(this._configuration.host.sslCertificateFileName);
            const serverOptions = {
                pfx: pfxFile,
                passphrase: this._configuration.host.sslCertificatePassword,
            };

            // Start listening over HTTPS
            const httpsServer = https.createServer(serverOptions, this._expressApp);
            httpsServer.listen(this._configuration.host.port, () => {
                console.log(`OAuth Web Proxy API is listening on HTTPS port ${this._configuration.host.port}`);
            });

        } else {

            // Otherwise listen over HTTP
            this._expressApp.listen(this._configuration.host.port, () => {
                console.log(`OAuth Web Proxy API is listening on HTTP port ${this._configuration.host.port}`);
            });
        }
    }
}
