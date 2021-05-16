import {ConfigurationLoader} from '../../core/configuration/configurationLoader';
import {Logger} from '../../core/logging/logger';
import {LogEntry} from '../../core/logging/logEntry';
import {LambdaRequest} from '../request/lambdaRequest';
import {LambdaResponse} from '../request/lambdaResponse';
import {LambdaConfiguration} from '../startup/lambdaConfiguration';

const handler = async (event: any): Promise<void> => {

    const logger = new Logger(true);
    const logEntry = new LogEntry();
    const request = new LambdaRequest(event, logEntry);
    const response = new LambdaResponse(logEntry);

    try {

        const configuration = await ConfigurationLoader.load();
        logger.initialize(configuration.api);

        const authorizer = new LambdaConfiguration(configuration).getAuthorizer();
        await authorizer.startLogin(request, response);
        return response.finalise();

    } catch (e) {

        const clientError = logger.handleError(e, logEntry);
        response.setError(clientError);
        return response.finalise();

    } finally {

        logger.write(logEntry);
    }
};

export {handler};
