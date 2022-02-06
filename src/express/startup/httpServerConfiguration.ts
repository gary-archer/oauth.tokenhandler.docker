import cookieParser from 'cookie-parser';
import cors, {CorsOptions} from 'cors';
import express, {Application, Request, Response} from 'express';
import fs from 'fs-extra';
import https from 'https';
import {Configuration} from '../../core/configuration/configuration';
import {AbstractRequest } from '../../core/request/abstractRequest';
import {AbstractResponse } from '../../core/request/abstractResponse';
import {Authorizer} from '../../core/services/authorizer';
import {CookieService} from '../../core/services/cookieService';
import {OAuthService} from '../../core/services/oauthService';
import {HttpProxy} from '../../core/utilities/httpProxy';
import {Logger} from '../../core/logging/logger';
import {ExpressRequestAdapter} from '../request/expressRequestAdapter';
import {ExpressResponseAdapter} from '../request/expressResponseAdapter';

/*
 * A private type for readability
 */
type ExpressRequestHandler = (request: AbstractRequest, response: AbstractResponse) => Promise<any>;

/*
 * Configure Express API behaviour
 */
export class HttpServerConfiguration {

    private readonly _expressApp: Application;
    private readonly _configuration: Configuration;
    private readonly _authorizer: Authorizer;
    private readonly _logger: Logger;

    /*
     * Auto wire the main aithorizer class, which is the entry point for processing
     */
    public constructor(
        expressApp: Application,
        configuration: Configuration,
        logger: Logger,
        httpProxy: HttpProxy) {

        this._expressApp = expressApp;
        this._configuration = configuration;
        this._logger = logger;

        this._authorizer = new Authorizer(
            this._configuration.api,
            new CookieService(configuration.api, configuration.client),
            new OAuthService(configuration.api, configuration.client, httpProxy));
    }

    /*
     * Set up routes for the API's OAuth operations
     */
    public async initialiseRoutes(): Promise<void> {

        // Configure CORS
        this._expressApp.use('/tokenhandler/*', cors(this._getCorsOptions()) as any);

        // Parse cookies and the request body
        this._expressApp.use('/tokenhandler/*', cookieParser());
        this._expressApp.use('/tokenhandler/*', express.json());

        // Do not cache API requests
        this._expressApp.set('etag', false);

        // Route requests through to the authorizer
        this._expressApp.post('/tokenhandler/login/start',
            (rq, rs) => this._executeMethod(rq, rs, this._authorizer.startLogin));

        this._expressApp.post('/tokenhandler/login/end',
            (rq, rs) => this._executeMethod(rq, rs, this._authorizer.endLogin));

        this._expressApp.post('/tokenhandler/refresh',
            (rq, rs) => this._executeMethod(rq, rs, this._authorizer.refresh));

        this._expressApp.post('/tokenhandler/expire',
            (rq, rs) => this._executeMethod(rq, rs, this._authorizer.expire));

        this._expressApp.post('/tokenhandler/logout',
            (rq, rs) => this._executeMethod(rq, rs, this._authorizer.logout));
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
                console.log(`Token Handler API is listening on HTTPS port ${this._configuration.host.port}`);
            });

        } else {

            // Otherwise listen over HTTP
            this._expressApp.listen(this._configuration.host.port, () => {
                console.log(`Token Handler API is listening on HTTP port ${this._configuration.host.port}`);
            });
        }
    }

    /*
     * Run outline processing for the supplied function reference
     */
    private async _executeMethod(rq: Request, rs: Response, fn: ExpressRequestHandler): Promise<void> {

        const logEntry = this._logger.createLogEntry();
        const request = new ExpressRequestAdapter(rq, logEntry);
        const response = new ExpressResponseAdapter(rs, logEntry);

        try {

            // Call the core authorizer routine
            await fn(request, response);

            // Update logs
            response.finaliseLogs();
            this._logger.write(logEntry);

            // Return a success response to the caller
            response.finaliseData();

        } catch (e) {

            // Process the error
            const clientError = this._logger.handleError(e, logEntry);
            response.setError(clientError);

            // Update logs
            response.finaliseLogs();
            this._logger.write(logEntry);

            // Return a failure response to the caller
            response.finaliseData();
        }
    }

    /*
     * The Express API handles CORS headers for OPTIONS, GET and POST requests
     * Allowed headers are not configured so any requested headers are returned in OPTIONS responses
     */
    private _getCorsOptions(): CorsOptions {

        return {
            origin: this._configuration.api.trustedWebOrigins,
            credentials: true,
            maxAge: 86400,
        } as CorsOptions;
    }
}
