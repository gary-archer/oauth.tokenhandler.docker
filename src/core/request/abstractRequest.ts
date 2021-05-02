/*
 * An abstraction to represent an incoming HTTP request, that works for both AWS lambda and Express
 */
export interface AbstractRequest {

    getUri(): string;

    getMethod(): string;

    getBody(): any;

    getHeader(name: string): string | null;

    getMultiValueHeader(name: string): string[];

    getCookie(name: string): string | null;
}
