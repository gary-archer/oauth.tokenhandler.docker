import url from 'url';

/*
 * Manage supplying the HTTP proxy on calls from the API to the Authorization Server
 */
export class HttpProxy {

    private _useProxy: boolean;
    private _proxyUrl: string;
    private _agent: any = null;

    public constructor(useProxy: boolean, proxyUrl: string) {

        this._useProxy = useProxy;
        this._proxyUrl = proxyUrl;
        this._agent = null;
        this._setupCallbacks();

        if (useProxy) {

            // Ensure that the standard environment variable is set for our process
            process.env.HTTPS_PROXY = this._proxyUrl;

            // Use a dynamic import so that this dependency is only used on a developer PC
            import('tunnel-agent').then((agent) => {

                const opts = url.parse(this._proxyUrl);
                this._agent = agent.httpsOverHttp({
                    proxy: opts,
                });
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
     * Plumbing to ensure the this parameter is available
     */
    private _setupCallbacks(): void {
        this.getAgent = this.getAgent.bind(this);
    }
}
