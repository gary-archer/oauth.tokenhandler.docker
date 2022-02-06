import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {Configuration} from '../../core/configuration/configuration';
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
 * A private type for readability
 */
type LambdaRequestHandler = (a: Authorizer) => (rq: AbstractRequest, rs: AbstractResponse) => Promise<void>;

/*
 * A very basic container to return some fixed oblects
 */
export class LambdaExecutor {

    private _configuration: Configuration;
    private _httpProxy: HttpProxy;

    public constructor(configuration: Configuration, httpProxy: HttpProxy) {
        this._configuration = configuration;
        this._httpProxy = httpProxy;
    }

    /*
     * Do the work of the supplied authorizer method
     */
    public async executeLambda(event: APIGatewayProxyEvent, fn: LambdaRequestHandler)
        : Promise<APIGatewayProxyResult> {

        // Create the authorizer
        const cookieService = new CookieService(this._configuration.api, this._configuration.client);
        const oauthService = new OAuthService(this._configuration.api, this._configuration.client, this._httpProxy);
        const authorizer = new Authorizer(this._configuration.api, cookieService, oauthService);

        // Get the supplied function reference on the authorizer
        const authorizerMethod = fn(authorizer);

        // Initialise logging and create the log entry
        const logger = new Logger(true);
        logger.initialise(this._configuration.api);
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
}
