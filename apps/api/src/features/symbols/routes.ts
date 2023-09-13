import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { pick } from 'ramda';

import { ApplicationDeps } from '#infra/applicationDeps.type.js';
import { commonHooksForAppRoutes } from '#infra/http/hooks.js';
import { HttpServerError, createAddHttpRouteError } from '#infra/http/server.error.js';
import { FastifyServer } from '#infra/http/server.type.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { buildGetSymbolsController } from './controllers/getSymbols.js';
import { SYMBOLS_ENDPOINTS } from './routes.constant.js';

export function addSymbolsRoutes(
  instance: FastifyServer,
  deps: ApplicationDeps,
): ioe.IOEither<HttpServerError<'AddRouteError'>, FastifyServer> {
  return pipe(ioe.sequenceArray([addGetSymbolsRoute(instance, deps)]), ioe.as(instance));
}

function addGetSymbolsRoute(
  instance: FastifyServer,
  deps: ApplicationDeps,
): ioe.IOEither<HttpServerError<'AddRouteError'>, FastifyServer> {
  const { method, url } = SYMBOLS_ENDPOINTS.GET_SYMBOLS;

  return pipe(
    pick(['symbolRepo'], deps),
    buildGetSymbolsController,
    ioe.of,
    ioe.chain((handler) =>
      ioe.tryCatch(
        () => instance.route({ method, url, handler, ...commonHooksForAppRoutes }),
        createErrorFromUnknown(createAddHttpRouteError(method, url)),
      ),
    ),
  );
}
