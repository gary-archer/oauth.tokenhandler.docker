/*
 * A simple logger class for stdout, or to write to a local file during lambda development
 */
export class Logger {

    public info(info: any): void {
        console.log(info);
    }

    public error(errorData: any): void {
        console.log(JSON.stringify(errorData, null, 2));
    }
}
