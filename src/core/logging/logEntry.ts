/*
 * Each API operation has a log entry, to support structured logging
 */
export class LogEntry {

    private readonly _data: any;

    public constructor(data: any) {
        this._data = data;
    }

    public getData(): any {
        return this._data;
    }
}
