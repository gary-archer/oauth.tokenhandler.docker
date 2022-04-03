import fs from 'fs-extra';
import {Configuration} from './configuration';

/*
 * A class to load the configuration file
 */
export class ConfigurationLoader {

    /*
     * Load JSON data from the app config file
     */
    public static load(): Configuration {

        const configurationBuffer = fs.readFileSync('api.config.json');
        const json = JSON.parse(configurationBuffer.toString());
        return json as Configuration;
    }
}
