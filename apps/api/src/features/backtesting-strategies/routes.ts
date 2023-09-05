import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { pick } from 'ramda';

import { ApplicationDeps } from '#infra/common.type.js';
import { commonHooksForAppRoutes } from '#infra/http/hooks.js';
import { HttpServerError, createAddHttpRouteError } from '#infra/http/server.error.js';
import { FastifyServer } from '#infra/http/server.type.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { buildAddBtStrategyController } from './controllers/addBtStrategy.js';
import { BT_STRATEGY_ENDPOINTS } from './routes.constant.js';

export function addBtStrategiesRoutes(
  instance: FastifyServer,
  deps: ApplicationDeps,
): ioe.IOEither<HttpServerError<'AddRouteError'>, FastifyServer> {
  return pipe(ioe.sequenceArray([addAddBtStrategyRoute(instance, deps)]), ioe.as(instance));
}

function addAddBtStrategyRoute(
  instance: FastifyServer,
  deps: ApplicationDeps,
): ioe.IOEither<HttpServerError<'AddRouteError'>, FastifyServer> {
  const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;

  return pipe(
    pick(['btStrategyRepo', 'idService', 'dateService'], deps),
    buildAddBtStrategyController,
    ioe.of,
    ioe.chain((handler) =>
      ioe.tryCatch(
        () => instance.route({ method, url, handler, ...commonHooksForAppRoutes }),
        createErrorFromUnknown(createAddHttpRouteError(method, url)),
      ),
    ),
  );
}
