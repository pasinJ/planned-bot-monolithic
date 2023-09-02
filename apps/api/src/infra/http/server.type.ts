import { FastifyError, FastifyInstance } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { Logger } from 'pino';

import { CustomError, ExternalError } from '#shared/error.js';

export type FastifyServer = FastifyInstance<Server, IncomingMessage, ServerResponse, Logger>;

export class BuildHttpServerError extends CustomError<'BUILD_HTTP_SERVER_ERROR', ExternalError>(
  'BUILD_HTTP_SERVER_ERROR',
  'Error happened when try to build a HTTP server',
) {}
export class StartHttpServerError extends CustomError<
  'ADD_ROUTE_ERROR' | 'ADD_PLUGIN_ERROR' | 'START_HTTP_SERVER_ERROR',
  ExternalError | FastifyError
>('START_HTTP_SERVER_ERROR', 'Error happened when try to start a HTTP server') {}

export class CloseHttpServerError extends CustomError<'CLOSE_HTTP_SERVER_ERROR', ExternalError>(
  'CLOSE_HTTP_SERVER_ERROR',
  'Error happened when try to close a HTTP server',
) {}

export class InternalHttpServerError extends CustomError<'INTERNAL_HTTP_SERVER_ERROR', FastifyError>(
  'INTERNAL_HTTP_SERVER_ERROR',
  'Error happened inside a HTTP server',
) {}
