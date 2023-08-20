import ioe from 'fp-ts/lib/IOEither.js';

import { createErrorFromUnknown } from '#shared/error.js';

import { FastifyServer, HttpServerError } from './server.type.js';

export function addGeneralRoutes(fastify: FastifyServer): ioe.IOEither<HttpServerError, FastifyServer> {
  return ioe.tryCatch(
    () => fastify.head('/', (_, reply) => reply.code(200).send()),
    createErrorFromUnknown(HttpServerError, 'INTERNAL_SERVER_ERROR'),
  );
}
