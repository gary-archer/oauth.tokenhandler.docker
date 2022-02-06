import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {Authorizer} from '../../core/services/authorizer';
import {Container} from '../startup/container';
import {LambdaConfiguration} from '../startup/lambdaConfiguration';

// The handler called at runtime invokes an executor
const container = new Container();
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return container.getExecutor().executeLambda(event, (a: Authorizer) => a.expire);
};

// Do some setup to create the executor, and return an enriched handler
const configuration = new LambdaConfiguration();
const handler = configuration.enrichHandler(baseHandler, container);
export {handler};