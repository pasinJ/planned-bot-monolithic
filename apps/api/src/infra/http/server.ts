import cors from '@fastify/cors';
import Fastify from 'fastify';
import e from 'fp-ts/lib/Either.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { nanoid } from 'nanoid';

import { PinoLogger, createLogger } from '#infra/logging.js';
import { AppDeps } from '#shared/appDeps.type.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { setErrorHandler, setNotFoundHandler } from './hooks.js';
import { addRoutes } from './routes.js';
import { getHttpConfig } from './server.config.js';
import {
  HttpServerError,
  createAddHookFailed,
  createAddPluginFailed,
  createHttpServerError,
} from './server.error.js';
import { FastifyServer } from './server.type.js';

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
): e.Either<HttpServerError<'InitiateServerFailed' | 'AddHookFailed'>, FastifyServer> {
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
  );
}

export function startHttpServer(
  fastify: FastifyServer,
  deps: AppDeps,
): te.TaskEither<HttpServerError<'AddPluginFailed' | 'AddRouteFailed' | 'StartServerFailed'>, FastifyServer> {
  const { PORT_NUMBER } = getHttpConfig();

  return pipe(
    ioe.tryCatch(
      () => fastify.register(cors, corsConfig),
      createErrorFromUnknown(createAddPluginFailed('CORS')),
    ),
    ioe.chainW(() => addRoutes(fastify, deps)),
    te.fromIOEither,
    te.chainFirst(() =>
      te.tryCatch(
        () => fastify.listen({ host: '0.0.0.0', port: PORT_NUMBER }),
        createErrorFromUnknown(createHttpServerError('StartServerFailed', 'Starting Fastify server failed')),
      ),
    ),
    te.as(fastify),
  );
}

export function closeHttpServer(
  instance: FastifyServer,
): te.TaskEither<HttpServerError<'CloseServerFailed'>, void> {
  return pipe(
    te.fromIO(() => instance.log.info('Fastify server start closing')),
    te.chain(() =>
      te.tryCatch(
        () => instance.close(),
        createErrorFromUnknown(createHttpServerError('CloseServerFailed', 'Closing Fastify server failed')),
      ),
    ),
    te.chainIOK(() => () => instance.log.info('Fastify server successfully closed')),
    te.orElseFirstIOK((error) => () => instance.log.error({ error }, 'Fastify server failed to close')),
  );
}
