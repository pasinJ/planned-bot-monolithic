import { RouteOptions } from 'fastify';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { pick } from 'ramda';

import { ApplicationDeps } from '#infra/applicationDeps.type.js';
import { commonHooksForAppRoutes } from '#infra/http/hooks.js';
import { HttpServerError, createAddHttpRouteError } from '#infra/http/server.error.js';
import { FastifyServer } from '#infra/http/server.type.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { buildAddBtStrategyController } from './controllers/addBtStrategy.js';
import { buildExecuteBtStrategyController } from './executeBtStrategy/controller.js';
import { BT_STRATEGY_ENDPOINTS } from './routes.constant.js';

export function addBtStrategiesRoutes(
  instance: FastifyServer,
  deps: ApplicationDeps,
): ioe.IOEither<HttpServerError<'AddRouteError'>, FastifyServer> {
  return pipe(
    ioe.of([addBtStrategyRouteOptions(deps), executeBtStrategyRouteOptions(deps)]),
    ioe.map((routeOptionsList) =>
      routeOptionsList.map(({ handler, method, url }) =>
        ioe.tryCatch(
          () => instance.route({ method, url, handler, ...commonHooksForAppRoutes }),
          createErrorFromUnknown(createAddHttpRouteError(method, url)),
        ),
      ),
    ),
    ioe.chain(ioe.sequenceArray),
    ioe.as(instance),
  );
}

function addBtStrategyRouteOptions(deps: ApplicationDeps): RouteOptions {
  return {
    ...BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY,
    handler: pipe(pick(['btStrategyRepo', 'dateService'], deps), buildAddBtStrategyController),
  };
}

function executeBtStrategyRouteOptions(deps: ApplicationDeps): RouteOptions {
  const { btStrategyModelDao, jobScheduler } = deps;
  return {
    ...BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY,
    handler: buildExecuteBtStrategyController({ btStrategyModelDao, jobScheduler }),
  };
}
