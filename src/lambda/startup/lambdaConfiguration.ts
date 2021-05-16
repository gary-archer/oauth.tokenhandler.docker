import middy from '@middy/core';
import cors from '@middy/http-cors';
import {Context, Handler} from 'aws-lambda';
import {Container} from './container';

// A custom type for more readable code
export type AsyncHandler = (event: any, context: Context) => Promise<any>;

/*
 * A class to wire up dependencies and middleware
 */
export class LambdaConfiguration {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
    }

    /*
     * Deal with cross cutting concerns in a single place for all lambdas
     */
    public enrichHandler(baseHandler: AsyncHandler): Handler {

        try {

            // Initialise the app
            this._container.initialize();
        
            // Then wrap the 
            return middy(async (event: any, context: Context) => {
                return baseHandler(event, context);

            }).use(cors({origins: [this._container.configuration.api.trustedWebOrigin]}));

        } catch(e) {

            // Return an error callback
            throw new Error('not implemented');
        }
    }
}
