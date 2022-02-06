import {APIGatewayProxyResult} from 'aws-lambda';
import {LambdaConfiguration} from '../startup/lambdaConfiguration';

// Return an empty result, and a CORS middleware object will append response headers needed by the SPA
const baseHandler = async (): Promise<APIGatewayProxyResult> => {
    return { statusCode: 200 } as APIGatewayProxyResult;
};

// Configure middleware and return an enriched handler
const configuration = new LambdaConfiguration();
const handler = configuration.enrichOptionsHandler(baseHandler);
export {handler};