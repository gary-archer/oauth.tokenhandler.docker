import {Configuration} from '../../core/configuration/configuration';
import {Authorizer} from '../../core/services/authorizer';
import {CookieService} from '../../core/services/cookieService';
import {MockOAuthServiceImpl} from '../../core/services/mockOAuthServiceImpl';
import {OAuthService} from '../../core/services/oauthService';
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
            new CookieService(this._configuration.host),
            this._getOAuthService());
    }

    /*
     * Return the OAuth service depending on the strategy
     */
    private _getOAuthService(): OAuthService {

        if (this._configuration.host.useMockResponses) {
            return new MockOAuthServiceImpl();
        } else {
            return new OAuthServiceImpl(this._configuration.host);
        }
    }
}
