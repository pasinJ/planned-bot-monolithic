import ioe from 'fp-ts/lib/IOEither.js';

import { createErrorFromUnknown } from '#shared/error.js';

import { FastifyServer, StartHttpServerError } from './server.type.js';

export function addGeneralRoutes(fastify: FastifyServer): ioe.IOEither<StartHttpServerError, FastifyServer> {
  return ioe.tryCatch(
    () => fastify.head('/', (_, reply) => reply.code(200).send()),
    createErrorFromUnknown(StartHttpServerError, 'START_HTTP_SERVER_ERROR'),
  );
}
