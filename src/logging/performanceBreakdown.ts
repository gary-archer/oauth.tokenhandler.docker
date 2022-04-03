/*
 * A utility to measure the performance of an API request
 */
export class PerformanceBreakdown {

    private _startTime!: [number, number];
    private _millisecondsTaken: number;

    public constructor() {
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
}
