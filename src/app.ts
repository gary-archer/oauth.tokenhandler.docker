import express from 'express';
import {ConfigurationLoader} from './configuration/configurationLoader';
import {ErrorUtils} from './errors/errorUtils';
import {LogEntry} from './logging/logEntry';
import {HttpServerConfiguration} from './startup/httpServerConfiguration';
import {ExtraCaCerts} from './utilities/extraCaCerts';
import {HttpProxy} from './utilities/httpProxy';

/*
 * The Express API host to run on a Developer PC or in Kubernetes environments
 */
(async () => {

    try {

        // This is needed on Linux
        ExtraCaCerts.initialize();

        // First load configuration
        const configuration = ConfigurationLoader.load();

        // Initialise logging and visibility of outbound OAuth messages
        const httpProxy = new HttpProxy(configuration.host.useHttpProxy, configuration.host.httpProxyUrl);

        // Create and start the Express API
        const expressApp = express();
        const httpServer = new HttpServerConfiguration(expressApp, configuration, httpProxy);
        await httpServer.initialiseRoutes();
        await httpServer.startListening();

    } catch (e) {

        // Log startup errors
        const logEntry = new LogEntry(false);
        logEntry.writeStartupError(ErrorUtils.createServerError(e));
    }
})();
