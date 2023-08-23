import Fastify from 'fastify';
import e from 'fp-ts/lib/Either.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { nanoid } from 'nanoid';
import { juxt } from 'ramda';

import { addSymbolsRoutes } from '#features/symbols/routes.js';
import { ApplicationDeps } from '#infra/common.type.js';
import { PinoLogger, createLogger } from '#infra/logging.js';
import { createErrorFromUnknown } from '#shared/error.js';

import { getHttpConfig } from '../../shared/config/http.js';
import { setErrorHandler, setNotFoundHandler } from './hooks.js';
import { addGeneralRoutes } from './routes.js';
import {
  BuildHttpServerError,
  CloseHttpServerError,
  FastifyServer,
  StartHttpServerError,
} from './server.type.js';

const fastifyConfig = {
  requestIdHeader: 'request-id',
  requestIdLogLabel: 'requestId',
  disableRequestLogging: true,
  trustProxy: true,
  genReqId: () => nanoid(),
};

export function buildHttpServer(mainLogger: PinoLogger): e.Either<BuildHttpServerError, FastifyServer> {
  return e.tryCatch(
    () => {
      const fastify = Fastify({ ...fastifyConfig, logger: createLogger('HttpServer', mainLogger) });

      setNotFoundHandler(fastify);
      setErrorHandler(fastify);

      return fastify;
    },
    createErrorFromUnknown(BuildHttpServerError, 'BUILD_HTTP_SERVER_ERROR'),
  );
}

export function startHttpServer(
  instance: FastifyServer,
  deps: ApplicationDeps,
): te.TaskEither<StartHttpServerError, FastifyServer> {
  const { PORT_NUMBER } = getHttpConfig();
  return pipe(
    juxt([addGeneralRoutes, addSymbolsRoutes])(instance, deps),
    ioe.sequenceArray,
    te.fromIOEither,
    te.chainFirst(() =>
      te.tryCatch(
        () => instance.listen({ host: '0.0.0.0', port: PORT_NUMBER }),
        createErrorFromUnknown(StartHttpServerError, 'START_HTTP_SERVER_ERROR'),
      ),
    ),
    te.map(() => instance),
  );
}

export function closeHttpServer(instance: FastifyServer): te.TaskEither<CloseHttpServerError, void> {
  return pipe(
    te.fromIO(() => instance.log.info('Fastify server start closing')),
    te.chain(() =>
      te.tryCatch(
        () => instance.close(),
        createErrorFromUnknown(CloseHttpServerError, 'CLOSE_HTTP_SERVER_ERROR'),
      ),
    ),
    te.chainIOK(() => () => instance.log.info('Fastify server successfully closed')),
    te.orElseFirstIOK((error) => () => instance.log.error({ error }, 'Fastify server failed to close')),
  );
}
