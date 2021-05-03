import {Configuration} from '../../core/configuration/configuration';
import {AuthService} from '../../core/services/authService';

/*
 * A class to wire up dependencies and middleware
 */
export class LambdaConfiguration {

    /*
     * This will be called enrichHandler later
     */
    public getAuthService(configuration: Configuration): AuthService {
        return new AuthService(configuration);
    }
}
