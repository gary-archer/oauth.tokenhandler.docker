import {Configuration} from '../../core/configuration/configuration';
import {Logger} from '../../core/logging/logger';
import {Authorizer} from '../../core/services/authorizer';
import {CookieService} from '../../core/services/cookieService';
import {OAuthService} from '../../core/services/oauthService';
import {HttpProxy} from '../../core/utilities/httpProxy';

/*
 * A class to wire up dependencies and middleware
 */
export class LambdaConfiguration {

    private readonly _configuration: Configuration;
    private readonly _logger: Logger;

    public constructor(configuration: Configuration, logger: Logger) {
        this._configuration = configuration;
        this._logger = logger;
    }

    /*
     * Auto wire the main auth service entry point class
     */
    public getAuthorizer(): Authorizer {

        const httpProxy = new HttpProxy(
            this._configuration.host.useHttpProxy,
            this._configuration.host.httpProxyUrl);

        return new Authorizer(
            this._configuration,
            new CookieService(this._configuration),
            new OAuthService(this._configuration, httpProxy),
            this._logger);
    }
}
