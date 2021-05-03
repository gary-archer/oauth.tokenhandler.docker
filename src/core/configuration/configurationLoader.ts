import fs from 'fs-extra';
import {Configuration} from './configuration';

/*
 * A class to load the configuration file
 */
export class ConfigurationLoader {

    /*
     * Load JSON data from the app config file
     */
    public static async load(): Promise<Configuration> {

        const configurationBuffer = await fs.readFile('api.config.json');
        return JSON.parse(configurationBuffer.toString()) as Configuration;
    }
}
