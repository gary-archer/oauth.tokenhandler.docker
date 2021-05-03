import {ClientConfiguration} from './clientConfiguration';
import {HostConfiguration} from './hostConfiguration';

/*
 * A holder for configuration settings
 */
export interface Configuration {

    host: HostConfiguration;

    clients: ClientConfiguration[];
}
