import {ConfigurationLoader} from '../../core/configuration/configurationLoader';
import {ExceptionHandler} from '../../core/errors/exceptionHandler';
import {Logger} from '../../core/logging/logger';
import {LambdaRequest} from '../request/lambdaRequest';
import {LambdaResponse} from '../request/lambdaResponse';
import {LambdaConfiguration} from '../startup/lambdaConfiguration';

const handler = async (event: any): Promise<void> => {

    const logger = new Logger(true);
    const request = new LambdaRequest(event);
    const response = new LambdaResponse();

    try {

        const configuration = await ConfigurationLoader.load();
        logger.initialize(configuration.api);

        const authorizer = new LambdaConfiguration(configuration, logger).getAuthorizer();
        await authorizer.refreshToken(request, response);
        return response.finalise();

    } catch (e) {

        const error = new ExceptionHandler(logger).handleError(e);
        response.setError(error);
        return response.finalise();
    }
};

export {handler};
