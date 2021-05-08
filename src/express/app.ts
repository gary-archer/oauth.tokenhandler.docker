import express from 'express';
import {ConfigurationLoader} from '../core/configuration/configurationLoader';
import {HttpServerConfiguration} from './startup/httpServerConfiguration';
import {ErrorHandler} from '../core/errors/errorHandler';
import {Logger} from '../core/utilities/logger';

/*
 * The Express API host
 */
(async () => {

    try {

        // First load configuration
        const configuration = await ConfigurationLoader.load();

        // Initialize HTTP proxy behaviour so that we can view outbound OAuth requests
        // HttpProxy.initialize(configuration.host.useHttpProxy, configuration.host.httpProxyUrl);

        // Create and start the Express API
        const expressApp = express();
        const httpServer = new HttpServerConfiguration(expressApp, configuration);
        await httpServer.initializeRoutes();
        await httpServer.startListening();

    } catch (e) {

        // Report startup errors
        const error = ErrorHandler.fromException(e);
        Logger.error(error.toLogFormat());
    }
})();
