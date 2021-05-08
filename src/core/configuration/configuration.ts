import {ApiConfiguration} from './apiConfiguration';
import {ClientConfiguration} from './clientConfiguration';
import {HostConfiguration} from './hostConfiguration';

/*
 * A holder for configuration settings
 */
export interface Configuration {

    host: HostConfiguration;

    api: ApiConfiguration;

    client: ClientConfiguration;
}
