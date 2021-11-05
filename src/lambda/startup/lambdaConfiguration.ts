import middy from '@middy/core';
import cors from '@middy/http-cors';
import {APIGatewayProxyEvent, APIGatewayProxyResult, Context} from 'aws-lambda';
import {LambdaExecutor} from './lambdaExecutor';

/*
 * A shorthand type for this module
 */
type AsyncHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;

/*
 * Configure lambdas with cross cutting concerns
 */
export class LambdaConfiguration {

    private readonly _executor: LambdaExecutor;

    public constructor(executor: LambdaExecutor) {
        this._executor = executor;
    }

    /*
     * Deal with cross cutting concerns in a single place for all lambdas
     */
    public enrichHandler(baseHandler: AsyncHandler)
        : middy.MiddyfiedHandler<APIGatewayProxyEvent, APIGatewayProxyResult> | AsyncHandler {

        try {

            // Run startup logic
            const configuration = this._executor.initialize();
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
                return this._executor.handleStartupError(e);
            };
        }
    }
}
