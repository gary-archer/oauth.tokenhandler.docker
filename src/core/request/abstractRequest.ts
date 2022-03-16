import {LogEntry} from '../logging/logEntry';

/*
 * An abstraction to represent an incoming HTTP request
 */
export interface AbstractRequest {

    getUri(): string;

    getMethod(): string;

    getJsonField(name: string): string | null;

    getHeader(name: string): string | null;

    getCookie(name: string): string | null;

    getLogEntry(): LogEntry;
}
