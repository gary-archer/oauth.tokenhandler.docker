import middy from '@middy/core';
import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';
import {ConfigurationLoader} from '../../core/configuration/configurationLoader';
import {Logger} from '../../core/logging/logger';
import {HttpProxy} from '../../core/utilities/httpProxy';
import {CorsMiddleware} from '../middleware/corsMiddleware';
import {LambdaExecutor} from '../utilities/lambdaExecutor';
import {Container} from './container';
import {StartupLogger} from './startupLogger';

/*
 * A shorthand type for this module
 */
type AsyncHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;

/*
 * Configure lambdas with cross cutting concerns
 */
export class LambdaConfiguration {

    /*
     * Deal with cross cutting concerns in a single place for all lambdas
     */
    public enrichOptionsHandler(baseHandler: AsyncHandler)
        : middy.MiddyfiedHandler<APIGatewayProxyEvent, APIGatewayProxyResult> | AsyncHandler {

        const logger = new Logger(true);
        try {

            // Load configuration
            const configuration = ConfigurationLoader.load();
            logger.initialise(configuration.api);

            // Wrap the base handler to include CORS processing
            const corsMiddleware = new CorsMiddleware(configuration.api.trustedWebOrigins);
            return middy(async (event: any, context: Context) => {
                return baseHandler(event, context);
            })
                .use(corsMiddleware);

        } catch (e) {

            // Handle any problems configuring the lambda
            return async () => {
                return StartupLogger.handleError(e, logger);
            };
        }
    }

    /*
     * Deal with cross cutting concerns in a single place for all lambdas
     */
    public enrichHandler(baseHandler: AsyncHandler, container: Container)
        : middy.MiddyfiedHandler<APIGatewayProxyEvent, APIGatewayProxyResult> | AsyncHandler {

        const logger = new Logger(true);
        try {

            // Load configuration
            const configuration = ConfigurationLoader.load();
            logger.initialise(configuration.api);

            // Initialize HTTP request visibility
            const httpProxy = new HttpProxy(configuration.host.useHttpProxy, configuration.host.httpProxyUrl);

            // Create the executor
            const executor = new LambdaExecutor(configuration, httpProxy);
            container.setExecutor(executor);

            // Wrap the base handler to include CORS processing
            const corsMiddleware = new CorsMiddleware(configuration.api.trustedWebOrigins);
            return middy(async (event: any, context: Context) => {
                return baseHandler(event, context);
            })
                .use(corsMiddleware);

        } catch (e) {

            // Handle any problems configuring the lambda
            return async () => {
                return StartupLogger.handleError(e, logger);
            };
        }
    }
}
