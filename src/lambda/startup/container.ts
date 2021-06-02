import {Configuration} from '../../core/configuration/configuration';
import {ConfigurationLoader} from '../../core/configuration/configurationLoader';
import {ErrorUtils} from '../../core/errors/errorUtils';
import {LogEntry} from '../../core/logging/logEntry';
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

    private readonly _logger: Logger;
    private readonly _logEntry: LogEntry;
    private _configuration: Configuration | null;
    private _authorizer: Authorizer | null;

    public constructor() {
        this._logger = new Logger(true);
        this._logEntry = this._logger.createLogEntry();
        this._configuration = null;
        this._authorizer = null;
    }

    /*
     * Run the startup code to auto wire objects
     */
    public initialize(): void {

        this._configuration = ConfigurationLoader.load();
        this._logger.initialise(this._configuration.api);

        const httpProxy = new HttpProxy(
            this._configuration.host.useHttpProxy,
            this._configuration.host.httpProxyUrl);

        this._authorizer = new Authorizer(
            this._configuration.api,
            new CookieService(this._configuration.api, this._configuration.client),
            new OAuthService(this._configuration.api, this._configuration.client, httpProxy));
    }

    /*
     * Return the logger to other startup processing code
     */
    public get logger(): Logger {
        return this._logger;
    }

    /*
     * Return the configuration to other startup processing code
     */
    public get configuration(): Configuration {
        return this._configuration!;
    }

    /*
     * Do the work of the authorizer method supplied
     */
    public async executeLambda(
        event: any,
        fn: (a: Authorizer) => (rq: AbstractRequest, rs: AbstractResponse) => Promise<void>): Promise<void> {

        // Access the function reference on the authorizer in this class
        const authorizerMethod = fn(this._authorizer!);

        // Adapt the request and response to core classes and invoke the method
        const request = new LambdaRequest(event, this._logEntry);
        const response = new LambdaResponse(this._logEntry);

        try {

            // Do the work
            await authorizerMethod(request, response);

            // Return the collected data
            return response.finaliseData();

        } catch (e) {

            // Handle and return error details
            const error = ErrorUtils.fromException(e);
            const clientError = this._logger.handleError(error, this._logEntry);
            response.setError(clientError);
            return response.finaliseData();

        } finally {

            // Always write logs before exiting
            response.finaliseLogs();
            this._logger.write(this._logEntry);
        }
    }

    /*
     * Similar to the above error handling but for startup errors
     */
    public handleStartupError(exception: any): any {

        // Get error details
        const error = ErrorUtils.fromException(exception);
        const clientError = this._logger.handleError(error, this._logEntry);

        // Add the error to logs
        const response = new LambdaResponse(this._logEntry);
        response.setError(clientError);
        this._logger.write(this._logEntry);

        // Return the error response
        return response.finaliseData();
    }
}
