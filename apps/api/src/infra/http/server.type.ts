import { FastifyInstance } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { Logger } from 'pino';

import { ErrorBase } from '#shared/error.js';

export type FastifyServer = FastifyInstance<Server, IncomingMessage, ServerResponse, Logger>;
export class HttpServerError extends ErrorBase<
  'BUILD_SERVER_ERROR' | 'START_SERVER_ERROR' | 'CLOSE_SERVER_ERROR' | 'INTERNAL_SERVER_ERROR'
> {}
