import TunnelAgent from 'tunnel-agent';
import url from 'url';

/*
 * Manage supplying the HTTP proxy on calls from the API to the Authorization Server
 */
export class HttpProxy {

    private readonly _proxyUrl: string;
    private readonly _agent: any = null;

    public constructor(useProxy: boolean, proxyUrl: string) {

        this._proxyUrl = '';
        this._agent = null;
        this._setupCallbacks();

        if (useProxy) {
            const opts = url.parse(proxyUrl);
            this._proxyUrl = proxyUrl;
            this._agent = TunnelAgent.httpsOverHttp({
                proxy: opts,
            });
        }
    }

    /*
     * Return the agent for use with Axios
     */
    public getAgent(): any {
        return this._agent;
    }

    /*
     * Return the URL when needed
     */
    public getUrl(): string {
        return this._proxyUrl;
    }

    /*
     * Plumbing to ensure the this parameter is available
     */
    private _setupCallbacks(): void {
        this.getAgent = this.getAgent.bind(this);
    }
}
