import {Authorizer} from '../../core/services/authorizer';
import {Container} from '../startup/container';
import {LambdaConfiguration} from '../startup/lambdaConfiguration';

const container = new Container();

// The callback invoked at runtime invokes an auto wired object
const baseHandler = async (event: any): Promise<void> => {
    return container.execute(event, (a: Authorizer) => a.startLogin);
}

// Auto wire objects into the container, and wrap the handler in middleware
const configuration = new LambdaConfiguration(container);
const handler = configuration.enrichHandler(baseHandler);

// Return the enriched handler
export {handler};
