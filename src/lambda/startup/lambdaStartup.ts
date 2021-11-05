import middy from '@middy/core';
import cors from '@middy/http-cors';
import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';
import {Container} from './container';

/*
 * A shorthand type for this module
 */
type AsyncHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;

/*
 * A class to manage setup for the lambda before it executes
 */
export class LambdaStartup {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
    }

    /*
     * Deal with cross cutting concerns in a single place for all lambdas
     */
    public enrichHandler(baseHandler: AsyncHandler)
        : middy.MiddyfiedHandler<APIGatewayProxyEvent, APIGatewayProxyResult> | AsyncHandler {

        try {

            // Run startup logic
            const configuration = this._container.initialize();
            const corsOptions = {
                origins: [configuration.api.trustedWebOrigin],
                credentials: true,
            };

            // Then wrap the base handler to include CORS processing
            return middy(async (event: any, context: Context) => {
                return baseHandler(event, context);

            })
                .use(cors(corsOptions));

        } catch (e) {

            // Handle any problems configuring the lambda
            return async () => {
                return this._container.handleStartupError(e);
            };
        }
    }
}
