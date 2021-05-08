import {Application} from 'express';
import fs from 'fs-extra';
import https from 'https';
import {Configuration} from '../../core/configuration/configuration';

/*
 * Configure Express API behaviour
 */
export class HttpServerConfiguration {

    private readonly _expressApp: Application;
    private readonly _configuration: Configuration;

    public constructor(expressApp: Application, configuration: Configuration) {

        this._expressApp = expressApp;
        this._configuration = configuration;
    }

    public async initializeRoutes(): Promise<void> {
    }

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
