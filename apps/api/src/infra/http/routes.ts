import ioe from 'fp-ts/lib/IOEither.js';

import { createErrorFromUnknown } from '#shared/error.js';

import { FastifyServer, StartHttpServerError } from './server.type.js';

export function addGeneralRoutes(instance: FastifyServer): ioe.IOEither<StartHttpServerError, FastifyServer> {
  return ioe.tryCatch(
    () => instance.head('/', (_, reply) => reply.code(200).send()),
    createErrorFromUnknown(StartHttpServerError, 'ADD_ROUTE_ERROR'),
  );
}
