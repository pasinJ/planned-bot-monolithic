import { RouteOptions } from 'fastify';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { juxt, pick } from 'ramda';

import { ApplicationDeps } from '#infra/common.type.js';
import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { FastifyServer, StartHttpServerError } from '#infra/http/server.type.js';
import { createErrorFromUnknown } from '#shared/error.js';

import { buildAddBtStrategyController } from './controllers/addBtStrategy.js';
import { BT_STRATEGY_ENDPOINTS } from './routes.constant.js';

const commonHooks: Pick<RouteOptions, 'preValidation' | 'onSend'> = {
  preValidation: preValidationHook,
  onSend: onSendHook,
};

export function addBtStrategiesRoutes(
  instance: FastifyServer,
  deps: ApplicationDeps,
): ioe.IOEither<StartHttpServerError, FastifyServer> {
  return pipe(
    ioe.fromIO(() => juxt([addAddBtStrategyRoute])(instance, deps)),
    ioe.chain(ioe.sequenceArray),
    ioe.map(() => instance),
  );
}

function addAddBtStrategyRoute(
  instance: FastifyServer,
  deps: ApplicationDeps,
): ioe.IOEither<StartHttpServerError, FastifyServer> {
  const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;

  return pipe(
    pick(['btStrategyRepo', 'idService', 'dateService'], deps),
    buildAddBtStrategyController,
    ioe.of,
    ioe.chain((handler) =>
      ioe.tryCatch(
        () => instance.route({ method, url, handler, ...commonHooks }),
        createErrorFromUnknown(StartHttpServerError, 'ADD_ROUTE_ERROR'),
      ),
    ),
  );
}
