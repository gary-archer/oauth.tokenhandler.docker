import {Configuration} from '../../core/configuration/configuration';
import {ConfigurationLoader} from '../../core/configuration/configurationLoader';
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
 * A primitive DI container class to hold some objects
 */
export class Container {

    private readonly _logger: Logger;
    private readonly _logEntry: LogEntry;
    private _configuration: Configuration | null;
    private _authorizer: Authorizer | null;

    public constructor() {
        this._logger = new Logger(true);
        this._logEntry = new LogEntry();
        this._configuration = null;
        this._authorizer = null;
    }

    public get configuration(): Configuration {
        return this._configuration!;
    }
    
    /*
     * Run the startup code to auto wire objects
     */
    public initialize(): void {

        this._configuration = new ConfigurationLoader().load();
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
     * Do the work of the supplied authorizer method
     */
    public async execute(
        event: any, 
        fn: (a: Authorizer) => (rq: AbstractRequest, rs: AbstractResponse) => Promise<void>) {

        // Get the authorizer method passed in
        const authorizerMethod = fn(this._authorizer!);
        
        // Adapt the request and response to core classes and invoke the method
        const request = new LambdaRequest(event, this._logEntry);
        const response = new LambdaResponse(this._logEntry);
        await authorizerMethod(request, response);

        // Return the result, and any errors are caught by the exception middleware
        return response.finalise();
    }
}
