import {PerformanceBreakdown} from './performanceBreakdown';

/*
 * The full implementation class is private to the framework and excluded from the index.ts file
 */
export class PerformanceBreakdownImpl implements PerformanceBreakdown {

    private _name: string;
    private _startTime!: [number, number];
    private _millisecondsTaken: number;
    private _children: PerformanceBreakdownImpl[];

    public constructor(name: string) {
        this._name = name;
        this._children = [];
        this._millisecondsTaken = 0;
    }

    /*
     * Start a performance measurement after creation
     */
    public start(): void {
        this._startTime = process.hrtime();
    }

    /*
     * Stop the timer and finish the measurement, converting nanoseconds to milliseconds
     */
    public dispose(): void {

        const endTime = process.hrtime(this._startTime);
        this._millisecondsTaken = Math.floor((endTime[0] * 1000000000 + endTime[1]) / 1000000);
    }

    /*
     * Return the time taken
     */
    public get millisecondsTaken(): number {
        return this._millisecondsTaken;
    }

    /*
     * Return data in the output format
     */
    public get data(): any {

        const data: any = {
            name: this._name,
            millisecondsTaken: this._millisecondsTaken,
        };

        if (this._children.length > 0) {
            data.children = [];
            this._children.forEach((child) => data.children.push(child.data));
        }

        return data;
    }

    /*
     * Add a child to the performance breakdown
     */
    public createChild(name: string): PerformanceBreakdown {

        const child = new PerformanceBreakdownImpl(name);
        this._children.push(child);
        child.start();
        return child;
    }
}
