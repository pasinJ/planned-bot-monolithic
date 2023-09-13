import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { addBtStrategyRouteOptions } from '#features/backtesting-strategies/addBtStrategy/route.js';
import { executeBtStrategyRouteOptions } from '#features/backtesting-strategies/executeBtStrategy/route.js';
import { getSymbolsRouteOptions } from '#features/symbols/getSymbols/route.js';
import { AppDeps } from '#shared/appDeps.type.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { HttpServerError, createAddHttpRouteError } from './server.error.js';
import { FastifyServer } from './server.type.js';

export function addRoutes(
  instance: FastifyServer,
  deps: AppDeps,
): ioe.IOEither<HttpServerError<'AddRouteFailed'>, FastifyServer> {
  return pipe(
    ioe.of([
      addBtStrategyRouteOptions(deps),
      executeBtStrategyRouteOptions(deps),
      getSymbolsRouteOptions(deps),
    ]),
    ioe.map((routeOptionsList) =>
      routeOptionsList.map((routeOptions) =>
        ioe.tryCatch(
          () => instance.route(routeOptions),
          createErrorFromUnknown(createAddHttpRouteError(routeOptions.method, routeOptions.url)),
        ),
      ),
    ),
    ioe.chain(ioe.sequenceArray),
    ioe.as(instance),
    ioe.chain(addGeneralRoutes),
  );
}

export function addGeneralRoutes(
  instance: FastifyServer,
): ioe.IOEither<HttpServerError<'AddRouteFailed'>, FastifyServer> {
  return ioe.tryCatch(
    () => instance.head('/', (_, reply) => reply.code(200).send()),
    createErrorFromUnknown(createAddHttpRouteError('HEAD', '/')),
  );
}
