import {Authorizer} from '../../core/services/authorizer';
import {Container} from '../startup/container';
import {LambdaStartup} from '../startup/lambdaStartup';

const container = new Container();

// The callback invoked at runtime invokes an auto wired object
const baseHandler = async (event: any): Promise<void> => {
    return container.executeLambda(event, (a: Authorizer) => a.startLogin);
};

// Auto wire objects into the container, and wrap the handler in middleware
const startup = new LambdaStartup(container);
const handler = startup.enrichHandler(baseHandler);

// Return the enriched handler
export {handler};
