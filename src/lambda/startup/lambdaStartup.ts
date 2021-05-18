import middy from '@middy/core';
import cors from '@middy/http-cors';
import {Context, Handler} from 'aws-lambda';
import {ExceptionMiddleware} from '../middleware.ts/exceptionMiddleware';
import {Container} from './container';

// A custom type for readability
export type AsyncHandler = (event: any, context: Context) => Promise<any>;

/*
 * A class to wire up dependencies and middleware
 */
export class LambdaStartup {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
    }

    /*
     * Deal with cross cutting concerns in a single place for all lambdas
     */
    public enrichHandler(baseHandler: AsyncHandler): Handler {

        try {

            // Run startup logic and populate the container with auto wired objects
            this._container.initialize();

            // Then wrap the base handler to manage error handling and CORS
            return middy(async (event: any, context: Context) => {
                return baseHandler(event, context);

            })
                .use(new ExceptionMiddleware(this._container))
                .use(cors({origins: [this._container.configuration.api.trustedWebOrigin]}));

        } catch (e) {

            // Handle any problems configuring the lambda
            return this._handleStartupError(e);
        }
    }

    /*
     * Ensure that any startup errors are logged and then return a handler that will provide the client response
     */
    private _handleStartupError(exception: any): Handler {

        return async () => {
            return this._container.handleError(exception);
        };
    }
}
