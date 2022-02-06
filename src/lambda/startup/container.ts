import {LambdaExecutor} from '../utilities/lambdaExecutor';

/*
 * A very basic container to return some fixed oblects
 */
export class Container {

    private _executor: LambdaExecutor | null;

    public constructor() {
        this._executor = null;
    }

    public setExecutor(executor: LambdaExecutor): void {
        this._executor = executor;
    }

    public getExecutor(): LambdaExecutor {
        return this._executor!;
    }
}
