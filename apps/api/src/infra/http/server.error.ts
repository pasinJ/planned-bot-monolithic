import { ErrorBase } from '#shared/error.js';

export class HttpServerError extends ErrorBase<HttpServerErrorName> {}
type HttpServerErrorName = 'START_HTTP_SERVER_FAILED' | 'INTERNAL_SERVER_ERROR';
