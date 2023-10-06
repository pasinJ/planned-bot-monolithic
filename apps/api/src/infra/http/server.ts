import cors from '@fastify/cors';
import Fastify, { FastifyInstance } from 'fastify';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { nanoid } from 'nanoid';
import { Logger } from 'pino';

import { PinoLogger, createLogger } from '#infra/logging.js';
import { AppDeps } from '#shared/appDeps.type.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { setErrorHandler, setNotFoundHandler } from './hooks.js';
import { addRoutes } from './routes.js';
import { PortNumber } from './server.config.js';
import {
  HttpServerError,
  createAddHookFailed,
  createAddPluginFailed,
  createHttpServerError,
} from './server.error.js';

export type FastifyServer = FastifyInstance<Server, IncomingMessage, ServerResponse, Logger>;
export type HttpServer = {
  config: (
    fn: (
      fastify: FastifyServer,
      deps: AppDeps,
    ) => ioe.IOEither<HttpServerError<'AddPluginFailed' | 'AddRouteFailed'>, void>,
  ) => ioe.IOEither<HttpServerError<'AddPluginFailed' | 'AddRouteFailed'>, void>;
  start: te.TaskEither<HttpServerError<'StartServerFailed'>, void>;
  stop: te.TaskEither<HttpServerError<'StopServerFailed'>, void>;
};

const fastifyConfig = {
  requestIdHeader: 'request-id',
  requestIdLogLabel: 'requestId',
  disableRequestLogging: true,
  trustProxy: true,
  genReqId: () => nanoid(),
};
const corsConfig: cors.FastifyCorsOptions = { origin: [/^http:\/\/localhost/] };

export function buildHttpServer(
  mainLogger: PinoLogger,
  getHttpConfig: io.IO<{ PORT_NUMBER: PortNumber }>,
  deps: AppDeps,
): e.Either<HttpServerError<'InitiateServerFailed' | 'AddHookFailed'>, HttpServer> {
  return pipe(
    e.tryCatch(
      () => Fastify({ ...fastifyConfig, logger: createLogger('HttpServer', mainLogger) }),
      createErrorFromUnknown(createHttpServerError('InitiateServerFailed', 'Initate Fastify server failed')),
    ),
    e.chainFirstW((fastify) =>
      e.tryCatch(
        () => setNotFoundHandler(fastify),
        createErrorFromUnknown(createAddHookFailed('Not found handler')),
      ),
    ),
    e.chainFirstW((fastify) =>
      e.tryCatch(
        () => setErrorHandler(fastify),
        createErrorFromUnknown(createAddHookFailed('Error handler')),
      ),
    ),
    e.map((fastify) => ({
      config: (fn) => fn(fastify, deps),
      start: start(fastify, getHttpConfig),
      stop: stop(fastify),
    })),
  );
}

function start(
  fastify: FastifyServer,
  getHttpConfig: io.IO<{ PORT_NUMBER: PortNumber }>,
): HttpServer['start'] {
  return pipe(
    te.fromIO(getHttpConfig),
    te.chain(({ PORT_NUMBER }) =>
      te.tryCatch(
        () => fastify.listen({ host: '0.0.0.0', port: PORT_NUMBER }),
        createErrorFromUnknown(createHttpServerError('StartServerFailed', 'Starting Fastify server failed')),
      ),
    ),
    te.asUnit,
  );
}
function stop(fastify: FastifyServer): HttpServer['stop'] {
  return pipe(
    te.fromIO(() => fastify.log.info('Fastify server start closing')),
    te.chain(() =>
      te.tryCatch(
        () => fastify.close(),
        createErrorFromUnknown(createHttpServerError('StopServerFailed', 'Closing Fastify server failed')),
      ),
    ),
    te.chainIOK(() => () => fastify.log.info('Fastify server successfully closed')),
    te.orElseFirstIOK((error) => () => fastify.log.error({ error }, 'Fastify server failed to close')),
  );
}

export function addPluginsAndRoutes(
  fastify: FastifyServer,
  deps: AppDeps,
): ioe.IOEither<HttpServerError<'AddPluginFailed' | 'AddRouteFailed'>, void> {
  return pipe(
    ioe.tryCatch(
      () => fastify.register(cors, corsConfig),
      createErrorFromUnknown(createAddPluginFailed('CORS')),
    ),
    ioe.chainW(() => addRoutes(fastify, deps)),
    ioe.asUnit,
  );
}
