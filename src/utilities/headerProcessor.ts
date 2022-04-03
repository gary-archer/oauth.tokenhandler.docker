import {Request} from 'express';

export class HeaderProcessor {

    /*
     * Read a header from the incoming request
     */
    public static getHeader(request: Request, name: string): string | null {

        if (request.headers) {
            const found = request.headers[name];
            if (found) {

                if (Array.isArray(found)) {
                    return found[0];
                }

                return found;
            }
        }

        return null;
    }
}