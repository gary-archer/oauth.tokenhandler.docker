import {Configuration} from '../../core/configuration/configuration';
import {ConfigurationLoader} from '../../core/configuration/configurationLoader';
import {ErrorUtils} from '../../core/errors/errorUtils';
import {Logger} from '../../core/logging/logger';
import {AbstractRequest} from '../../core/request/abstractRequest';
import {AbstractResponse} from '../../core/request/abstractResponse';
import {Authorizer} from '../../core/services/authorizer';
import {CookieService} from '../../core/services/cookieService';
import {OAuthService} from '../../core/services/oauthService';
import {HttpProxy} from '../../core/utilities/httpProxy';
import {LambdaRequest} from '../request/lambdaRequest';
import {LambdaResponse} from '../request/lambdaResponse';

/*
 * A primitive DI container class to manage objects and provide some shared entry points
 */
export class Container {

    private _configuration: Configuration | null;
    private _httpProxy: HttpProxy | null;

    public constructor() {
        this._configuration = null;
        this._httpProxy = null;
    }

    /*
     * Create singletons when the lambda is enriched, before it executes
     */
    public initialize(): Configuration {

        this._configuration = ConfigurationLoader.load();

        this._httpProxy = new HttpProxy(
            this._configuration.host.useHttpProxy,
            this._configuration.host.httpProxyUrl);

        return this._configuration;
    }

    /*
     * Do the work of the authorizer method when the lambda is called
     */
    public async executeLambda(
        event: any,
        fn: (a: Authorizer) => (rq: AbstractRequest, rs: AbstractResponse) => Promise<void>): Promise<void> {

        // Create the authorizer
        const configuration = this._configuration!;
        const authorizer = new Authorizer(
            configuration.api,
            new CookieService(configuration.api, configuration.client),
            new OAuthService(configuration.api, configuration.client, this._httpProxy!));

        // Get the supplied function reference on the authorizer
        const authorizerMethod = fn(authorizer);

        // Initialise logging and create the log entry
        const logger = new Logger(true);
        logger.initialise(this._configuration!.api);
        const logEntry = logger.createLogEntry();

        // Adapt the request and response to core classes
        const request = new LambdaRequest(event, logEntry);
        const response = new LambdaResponse(logEntry);

        try {

            // Invoke the method to do the work
            await authorizerMethod(request, response);

            // Finalise logs before exiting
            response.finaliseLogs();
            logger.write(logEntry);

            // Return the response data
            return response.finaliseData();

        } catch (e) {

            // Process error details
            const error = ErrorUtils.fromException(e);
            const clientError = logger.handleError(error, logEntry);

            // Add the error to logs
            response.setError(clientError);
            response.finaliseLogs();
            logger.write(logEntry);

            // Return the response data
            return response.finaliseData();
        }
    }

    /*
     * Error handling and logging for startup errors
     */
    public handleStartupError(exception: any): any {

        // Initialise logging and create the log entry
        const logger = new Logger(true);
        logger.initialise(this._configuration!.api);
        const logEntry = logger.createLogEntry();

        // Process error details
        const error = ErrorUtils.fromException(exception);
        const clientError = logger.handleError(error, logEntry);

        // Add the error to logs
        const response = new LambdaResponse(logEntry);
        response.setError(clientError);
        response.finaliseLogs();
        logger.write(logEntry);

        // Return the response data
        return response.finaliseData();
    }
}
