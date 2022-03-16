import express from 'express';
import {ConfigurationLoader} from '../core/configuration/configurationLoader';
import {HttpServerConfiguration} from './startup/httpServerConfiguration';
import {Logger} from '../core/logging/logger';
import {HttpProxy} from '../core/utilities/httpProxy';

/*
 * The Express API host to run on a Developer PC or in Kubernetes environments
 */
(async () => {

    const logger = new Logger();
    try {

        // First load configuration
        const configuration = ConfigurationLoader.load();

        // Initialise logging and visibility of outbound OAuth messages
        logger.initialise(configuration.api);
        const httpProxy = new HttpProxy(configuration.host.useHttpProxy, configuration.host.httpProxyUrl);

        // Create and start the Express API
        const expressApp = express();
        const httpServer = new HttpServerConfiguration(
            expressApp,
            configuration,
            logger,
            httpProxy);

        await httpServer.initialiseRoutes();
        await httpServer.startListening();

    } catch (e) {

        // Call an operation specific to startup errors, with no request object
        logger.handleStartupError(e);
    }
})();
