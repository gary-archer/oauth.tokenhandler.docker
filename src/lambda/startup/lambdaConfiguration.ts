import {Configuration} from '../../core/configuration/configuration';
import {Authorizer} from '../../core/services/authorizer';
import {CookieService} from '../../core/services/cookieService';
import {OAuthServiceImpl} from '../../core/services/oauthServiceImpl';

/*
 * A class to wire up dependencies and middleware
 */
export class LambdaConfiguration {

    private readonly _configuration: Configuration;

    public constructor(configuration: Configuration) {
        this._configuration = configuration;
    }

    /*
     * Auto wire the main auth service entry point class
     */
    public getAuthorizer(): Authorizer {

        return new Authorizer(
            this._configuration,
            new CookieService(this._configuration),
            new OAuthServiceImpl(this._configuration.oauth));
    }
}
