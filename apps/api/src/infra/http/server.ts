import Fastify from 'fastify';
import e from 'fp-ts/lib/Either.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { flow, pipe } from 'fp-ts/lib/function.js';
import { nanoid } from 'nanoid';
import { juxt } from 'ramda';

import { LoggerIO, createPinoLogger } from '#infra/logging.js';
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

export function buildHttpServer(): e.Either<BuildHttpServerError, FastifyServer> {
  return e.tryCatch(
    () => {
      const fastify = Fastify({ ...fastifyConfig, logger: createPinoLogger('HTTP') });

      setNotFoundHandler(fastify);
      setErrorHandler(fastify);

      return fastify;
    },
    createErrorFromUnknown(BuildHttpServerError, 'BUILD_HTTP_SERVER_ERROR'),
  );
}

export function startHttpServer(instnace: FastifyServer): te.TaskEither<StartHttpServerError, FastifyServer> {
  const { PORT_NUMBER } = getHttpConfig();
  return pipe(
    ioe.of(instnace),
    ioe.chainFirst(flow(juxt([addGeneralRoutes]), ioe.sequenceArray)),
    te.fromIOEither,
    te.chainFirst(() =>
      te.tryCatch(
        () => instnace.listen({ host: '0.0.0.0', port: PORT_NUMBER }),
        createErrorFromUnknown(StartHttpServerError, 'START_HTTP_SERVER_ERROR'),
      ),
    ),
  );
}

export function closeHttpServer(
  instnace: FastifyServer,
  loggerIo: LoggerIO,
): te.TaskEither<CloseHttpServerError, void> {
  return pipe(
    te.fromIO(loggerIo.info('Fastify server start closing')),
    te.chain(() =>
      te.tryCatch(
        () => instnace.close(),
        createErrorFromUnknown(CloseHttpServerError, 'CLOSE_HTTP_SERVER_ERROR'),
      ),
    ),
    te.chainIOK(() => loggerIo.info('Fastify server successfully closed')),
    te.orElseFirstIOK((error) => loggerIo.error({ error }, 'Fastify server failed to close')),
  );
}
