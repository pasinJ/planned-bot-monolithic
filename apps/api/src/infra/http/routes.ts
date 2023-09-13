import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { addBtStrategyRouteOptions } from '#features/backtesting-strategies/addBtStrategy/routes.js';
import { executeBtStrategyRouteOptions } from '#features/backtesting-strategies/executeBtStrategy/routes.js';
import { ApplicationDeps } from '#infra/applicationDeps.type.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { HttpServerError, createAddHttpRouteError } from './server.error.js';
import { FastifyServer } from './server.type.js';

export function addRoutes(
  instance: FastifyServer,
  deps: ApplicationDeps,
): ioe.IOEither<HttpServerError<'AddRouteError'>, FastifyServer> {
  return pipe(
    ioe.of([addBtStrategyRouteOptions(deps), executeBtStrategyRouteOptions(deps)]),
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
): ioe.IOEither<HttpServerError<'AddRouteError'>, FastifyServer> {
  return ioe.tryCatch(
    () => instance.head('/', (_, reply) => reply.code(200).send()),
    createErrorFromUnknown(createAddHttpRouteError('HEAD', '/')),
  );
}
