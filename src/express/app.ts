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

    const logger = new Logger(false);
    try {

        // First load configuration
        const configuration = await ConfigurationLoader.load();

        // Initialise logging and visibility of outbound OAuth messages
        logger.initialize(configuration.api);
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
