import { FastifyError, FastifyInstance } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { Logger } from 'pino';

import { ErrorBase, ExternalError } from '#shared/error.js';

export type FastifyServer = FastifyInstance<Server, IncomingMessage, ServerResponse, Logger>;

export class BuildHttpServerError extends ErrorBase<'BUILD_HTTP_SERVER_ERROR', ExternalError> {}
export class StartHttpServerError extends ErrorBase<
  'START_HTTP_SERVER_ERROR',
  ExternalError | FastifyError
> {}
export class CloseHttpServerError extends ErrorBase<'CLOSE_HTTP_SERVER_ERROR', ExternalError> {}
export class InternalHttpServerError extends ErrorBase<'INTERNAL_HTTP_SERVER_ERROR', FastifyError> {}
