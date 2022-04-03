/*
 * Data returned to the SPA whenever a browser tab loads
 */
export interface PageLoadResponse {
    isLoggedIn: boolean;
    handled: boolean;
    antiForgeryToken: string | null;
}
