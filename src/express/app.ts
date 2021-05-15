import express from 'express';
import {ConfigurationLoader} from '../core/configuration/configurationLoader';
import {HttpServerConfiguration} from './startup/httpServerConfiguration';
import {ExceptionHandler} from '../core/errors/exceptionHandler';
import {Logger} from '../core/logging/logger';
import {HttpProxy} from '../core/utilities/httpProxy';

/*
 * The Express API host
 */
(async () => {

    const logger = new Logger();
    try {

        // First load configuration
        const configuration = await ConfigurationLoader.load();

        // Initialize HTTP proxy behaviour so that we can view outbound OAuth requests
        const httpProxy = new HttpProxy(configuration.host.useHttpProxy, configuration.host.httpProxyUrl);

        // Create and start the Express API
        const expressApp = express();
        const httpServer = new HttpServerConfiguration(
            expressApp,
            configuration,
            logger,
            httpProxy);

        await httpServer.initializeRoutes();
        await httpServer.startListening();

    } catch (e) {

        // Report startup errors
        const handler = new ExceptionHandler(logger);
        handler.handleError(e);
    }
})();
