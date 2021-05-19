import middy from '@middy/core';
import {Container} from '../startup/container';

/*
 * Middleware to catch exceptions thrown during lambda event handler execution
 */
export class ExceptionMiddleware implements middy.MiddlewareObject<any, any> {

    private readonly _container: Container;

    public constructor(container: Container) {
        this._container = container;
        this._setupCallbacks();
    }

    /*
     * All exceptions are caught and returned from AWS here, and next is always called
     */
    public onError(handler: middy.HandlerLambda<any, any>, next: middy.NextFunction): void {

        handler.response = this._container.handleError(handler.error);
        next();
    }

    /*
     * Plumbing to ensure that the this parameter is available in async callbacks
     */
    private _setupCallbacks(): void {
        this.onError = this.onError.bind(this);
    }
}
