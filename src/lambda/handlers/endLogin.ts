
import {Context} from 'aws-lambda';
import {ConfigurationLoader} from '../../core/configuration/configurationLoader';
import {ExceptionHandler} from '../../core/errors/exceptionHandler';
import {Logger} from '../../core/logging/logger';
import {LambdaRequest} from '../request/lambdaRequest';
import {LambdaResponse} from '../request/lambdaResponse';
import {LambdaConfiguration} from '../startup/lambdaConfiguration';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const handler = async (event: any, context: Context) => {

    const logger = new Logger();
    const request = new LambdaRequest(event);
    const response = new LambdaResponse();

    try {

        const configuration = await ConfigurationLoader.load();
        const authorizer = new LambdaConfiguration(configuration, logger).getAuthorizer();
        await authorizer.endLogin(request, response);
        return response.finalise();

    } catch (e) {

        const error = new ExceptionHandler(logger).handleError(e);
        response.setError(error);
        return response.finalise();
    }
};

export {handler};
