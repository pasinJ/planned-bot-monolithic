import ioe from 'fp-ts/lib/IOEither.js';

import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { HttpServerError, createAddHttpRouteError } from './server.error.js';
import { FastifyServer } from './server.type.js';

export function addGeneralRoutes(
  instance: FastifyServer,
): ioe.IOEither<HttpServerError<'AddRouteError'>, FastifyServer> {
  return ioe.tryCatch(
    () => instance.head('/', (_, reply) => reply.code(200).send()),
    createErrorFromUnknown(createAddHttpRouteError('HEAD', '/')),
  );
}
