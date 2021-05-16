import fs from 'fs-extra';
import {Configuration} from './configuration';

/*
 * A class to load the configuration file
 */
export class ConfigurationLoader {

    /*
     * Load JSON data from the app config file
     */
    public load(): Configuration {

        const configurationBuffer = fs.readFileSync('api.config.json');
        return JSON.parse(configurationBuffer.toString()) as Configuration;
    }
}
