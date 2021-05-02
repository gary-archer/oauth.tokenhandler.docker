import {Context} from 'aws-lambda';
import {ConfigurationLoader} from '../../core/configuration/configurationLoader';
import {ErrorHandler} from '../../core/errors/errorHandler';
import {AuthService} from '../../core/services/authService';
import {LambdaRequest} from '../request/lambdaRequest';
import {LambdaResponse} from '../request/lambdaResponse';

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const handler = async (event: any, context: Context) => {

    const request = new LambdaRequest(event);
    const response = new LambdaResponse();

    try {

        const configuration = await ConfigurationLoader.load();
        const service = new AuthService(configuration);
        await service.refreshTokenGrant(request, response);

        response.addHeader('content-type', 'application/json');
        return response.getPayload(200);

    } catch (e) {

        const error = ErrorHandler.handleError(e);
        response.setError(error);
        response.addHeader('content-type', 'application/json');
        return response.getPayload(error.statusCode);
    }
};

export {handler};
