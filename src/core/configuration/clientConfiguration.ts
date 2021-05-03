/*
 * The OAuth settings for a single SPA
 */
export interface ClientConfiguration {

    name: string;

    clientId: string;

    redirectUri: string;

    postLogoutRedirectUri: string;

    cookiePath: string;
}