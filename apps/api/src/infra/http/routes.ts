import { RouteOptions } from 'fastify';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { addBtStrategyRouteOptions } from '#features/btStrategies/addBtStrategy/route.js';
import { executeBtStrategyRouteOptions } from '#features/btStrategies/executeBtStrategy/route.js';
import { getSymbolsRouteOptions } from '#features/symbols/getSymbols/route.js';
import { AppDeps } from '#shared/appDeps.type.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { HttpServerError, createAddHttpRouteError } from './server.error.js';
import type { FastifyServer } from './server.js';

const generalRouteOptions: RouteOptions = {
  method: 'HEAD',
  url: '/',
  handler: (_, reply) => reply.code(200).send(),
};

export function addRoutes(
  fastify: FastifyServer,
  deps: AppDeps,
): ioe.IOEither<HttpServerError<'AddRouteFailed'>, void> {
  return pipe(
    ioe.of([
      generalRouteOptions,
      addBtStrategyRouteOptions(deps),
      executeBtStrategyRouteOptions(deps),
      getSymbolsRouteOptions(deps),
    ]),
    ioe.map((routeOptionsList) =>
      routeOptionsList.map((routeOptions) =>
        ioe.tryCatch(
          () => fastify.route(routeOptions),
          createErrorFromUnknown(createAddHttpRouteError(routeOptions.method, routeOptions.url)),
        ),
      ),
    ),
    ioe.chain(ioe.sequenceArray),
    ioe.asUnit,
  );
}
