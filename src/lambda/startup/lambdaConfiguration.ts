import {Configuration} from '../../core/configuration/configuration';
import {Authorizer} from '../../core/services/authorizer';
import {CookieService} from '../../core/services/cookieService';
import {OAuthService} from '../../core/services/oauthService';
import {HttpProxy} from '../../core/utilities/httpProxy';

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

        const httpProxy = new HttpProxy(
            this._configuration.host.useHttpProxy,
            this._configuration.host.httpProxyUrl);

        return new Authorizer(
            this._configuration.api,
            new CookieService(this._configuration.api, this._configuration.client),
            new OAuthService(this._configuration.api, this._configuration.client, httpProxy));
    }
}
