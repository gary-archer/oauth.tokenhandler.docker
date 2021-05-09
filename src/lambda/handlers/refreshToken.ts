import {Context} from 'aws-lambda';
import {ConfigurationLoader} from '../../core/configuration/configurationLoader';
import {ErrorHandler} from '../../core/errors/errorHandler';
import {LambdaRequest} from '../request/lambdaRequest';
import {LambdaResponse} from '../request/lambdaResponse';
import {LambdaConfiguration} from '../startup/lambdaConfiguration';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const handler = async (event: any, context: Context) => {

    const request = new LambdaRequest(event);
    const response = new LambdaResponse();

    try {

        const configuration = await ConfigurationLoader.load();
        const authorizer = new LambdaConfiguration(configuration).getAuthorizer();
        await authorizer.refreshToken(request, response);
        return response.finalise();

    } catch (e) {

        const error = ErrorHandler.handleError(e);
        response.setError(error);
        return response.finalise();
    }
};

export {handler};
