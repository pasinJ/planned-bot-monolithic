import { RouteOptions } from 'fastify';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { juxt, pick } from 'ramda';

import { ApplicationDeps } from '#infra/common.type.js';
import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { FastifyServer, StartHttpServerError } from '#infra/http/server.type.js';
import { createErrorFromUnknown } from '#shared/error.js';

import { buildGetSymbolsController } from './controllers/getSymbols.js';
import { SYMBOLS_ENDPOINTS } from './routes.constant.js';

const commonHooks: Pick<RouteOptions, 'preValidation' | 'onSend'> = {
  preValidation: preValidationHook,
  onSend: onSendHook,
};

export function addSymbolsRoutes(
  instance: FastifyServer,
  deps: ApplicationDeps,
): ioe.IOEither<StartHttpServerError, FastifyServer> {
  return pipe(
    ioe.fromIO(() => juxt([addGetSymbolsRoute])(instance, deps)),
    ioe.chain(ioe.sequenceArray),
    ioe.map(() => instance),
  );
}

function addGetSymbolsRoute(
  instance: FastifyServer,
  deps: ApplicationDeps,
): ioe.IOEither<StartHttpServerError, FastifyServer> {
  const { method, url } = SYMBOLS_ENDPOINTS.GET_SYMBOLS;

  return pipe(
    pick(['symbolRepo'], deps),
    buildGetSymbolsController,
    ioe.of,
    ioe.chain((handler) =>
      ioe.tryCatch(
        () => instance.route({ method, url, handler, ...commonHooks }),
        createErrorFromUnknown(StartHttpServerError, 'ADD_ROUTE_ERROR'),
      ),
    ),
  );
}
