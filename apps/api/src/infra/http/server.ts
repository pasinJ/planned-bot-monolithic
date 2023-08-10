import Fastify, { FastifyInstance } from 'fastify';
import te from 'fp-ts/lib/TaskEither.js';
import { IncomingMessage, Server, ServerResponse } from 'http';
import { nanoid } from 'nanoid';
import { Logger } from 'pino';

import { createPinoLogger } from '#infra/logging.js';
import { createErrorFromUnknown } from '#shared/error.js';

import { getHttpConfig } from '../../shared/config/http.config.js';
import { setErrorHandler, setNotFoundHandler } from './hooks.js';
import { addGeneralRoutes, addRoutesV1 } from './routes.js';
import { HttpServerError } from './server.error.js';

const fastifyConfig = {
  requestIdHeader: 'request-id',
  requestIdLogLabel: 'requestId',
  disableRequestLogging: true,
  trustProxy: true,
  genReqId: () => nanoid(),
};

export type FastifyServer = FastifyInstance<Server, IncomingMessage, ServerResponse, Logger>;

export function startHttpServer(): te.TaskEither<HttpServerError, FastifyServer> {
  return te.tryCatch(
    async () => {
      const fastify = Fastify({ ...fastifyConfig, logger: createPinoLogger('HTTP') });

      setNotFoundHandler(fastify);
      setErrorHandler(fastify);
      addGeneralRoutes(fastify);
      await addRoutesV1(fastify);

      const { PORT_NUMBER } = getHttpConfig();
      fastify.listen({ host: '0.0.0.0', port: PORT_NUMBER }, (err) => {
        if (err) throw err;
      });

      return fastify;
    },
    createErrorFromUnknown(HttpServerError, 'START_HTTP_SERVER_FAILED'),
  );
}

export const closeHttpServer = async (fastify: FastifyServer, logger: Logger) => {
  return fastify
    .close()
    .then(() => logger.info('Fastify successfully closed'))
    .catch((error: unknown) => logger.error({ error }, 'An error happened when trying to close Fastify'));
};
