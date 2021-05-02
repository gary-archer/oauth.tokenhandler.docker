/*
 * A simple logger class to output to CloudWatch or a developer PC
 */
export class Logger {

    public static error(errorData: any): void {
        console.log(JSON.stringify(errorData, null, 2));
    }
}
