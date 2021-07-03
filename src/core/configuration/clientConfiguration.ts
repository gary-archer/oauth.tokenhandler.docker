/*
 * The OAuth settings for a single SPA
 */
export interface ClientConfiguration {

    name: string;

    clientId: string;

    clientSecret: string;

    redirectUri: string;

    postLogoutRedirectUri: string;

    scope: string;

    path: string;
}
