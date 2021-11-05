import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import {Authorizer} from '../../core/services/authorizer';
import {LambdaConfiguration} from '../startup/lambdaConfiguration';
import {LambdaExecutor} from '../startup/lambdaExecutor';

// The handler called at runtime invokes a shared executor
const executor = new LambdaExecutor();
const baseHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    return executor.executeLambda(event, (a: Authorizer) => a.logout);
};

// Configure cross cutting concerns and return an enriched handler
const configuration = new LambdaConfiguration(executor);
const handler = configuration.enrichHandler(baseHandler);
export {handler};