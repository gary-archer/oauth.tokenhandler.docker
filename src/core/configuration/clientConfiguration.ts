/*
 * The OAuth settings for a single SPA
 */
export interface ClientConfiguration {

    clientId: string;

    clientSecret: string;

    redirectUri: string;

    postLogoutRedirectUri: string;

    scope: string;
}
