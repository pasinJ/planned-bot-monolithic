import cors from '@fastify/cors';
import Fastify from 'fastify';
import e from 'fp-ts/lib/Either.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { nanoid } from 'nanoid';

import { addBtStrategiesRoutes } from '#features/backtesting-strategies/routes.js';
import { addSymbolsRoutes } from '#features/symbols/routes.js';
import { ApplicationDeps } from '#infra/common.type.js';
import { PinoLogger, createLogger } from '#infra/logging.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { getHttpConfig } from '../../shared/config/http.js';
import { setErrorHandler, setNotFoundHandler } from './hooks.js';
import { addGeneralRoutes } from './routes.js';
import {
  HttpServerError,
  createAddHookError,
  createAddPluginError,
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
): e.Either<HttpServerError<'InitiateServerError' | 'AddHookError'>, FastifyServer> {
  return pipe(
    e.tryCatch(
      () => Fastify({ ...fastifyConfig, logger: createLogger('HttpServer', mainLogger) }),
      createErrorFromUnknown(createHttpServerError('InitiateServerError', 'Initate Fastify server failed')),
    ),
    e.chainFirstW((fastify) =>
      e.tryCatch(
        () => setNotFoundHandler(fastify),
        createErrorFromUnknown(createAddHookError('Not found handler')),
      ),
    ),
    e.chainFirstW((fastify) =>
      e.tryCatch(() => setErrorHandler(fastify), createErrorFromUnknown(createAddHookError('Error handler'))),
    ),
  );
}

export function startHttpServer(
  fastify: FastifyServer,
  deps: ApplicationDeps,
): te.TaskEither<HttpServerError<'AddPluginError' | 'AddRouteError' | 'StartServerError'>, FastifyServer> {
  const { PORT_NUMBER } = getHttpConfig();

  return pipe(
    ioe.tryCatch(
      () => fastify.register(cors, corsConfig),
      createErrorFromUnknown(createAddPluginError('CORS')),
    ),
    ioe.chain(() =>
      ioe.sequenceArray([
        addGeneralRoutes(fastify),
        addSymbolsRoutes(fastify, deps),
        addBtStrategiesRoutes(fastify, deps),
      ]),
    ),
    te.fromIOEither,
    te.chainFirst(() =>
      te.tryCatch(
        () => fastify.listen({ host: '0.0.0.0', port: PORT_NUMBER }),
        createErrorFromUnknown(createHttpServerError('StartServerError', 'Starting Fastify server failed')),
      ),
    ),
    te.as(fastify),
  );
}

export function closeHttpServer(
  instance: FastifyServer,
): te.TaskEither<HttpServerError<'CloseServerError'>, void> {
  return pipe(
    te.fromIO(() => instance.log.info('Fastify server start closing')),
    te.chain(() =>
      te.tryCatch(
        () => instance.close(),
        createErrorFromUnknown(createHttpServerError('CloseServerError', 'Closing Fastify server failed')),
      ),
    ),
    te.chainIOK(() => () => instance.log.info('Fastify server successfully closed')),
    te.orElseFirstIOK((error) => () => instance.log.error({ error }, 'Fastify server failed to close')),
  );
}
