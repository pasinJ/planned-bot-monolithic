import { RouteOptions } from 'fastify';

import { ApplicationDeps } from '#infra/applicationDeps.type.js';
import { commonHooksForAppRoutes } from '#infra/http/hooks.js';

import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildAddBtStrategyController } from './controller.js';

export function addBtStrategyRouteOptions(deps: ApplicationDeps): RouteOptions {
  const { btStrategyModelDao, dateService } = deps;

  return {
    ...BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY,
    ...commonHooksForAppRoutes,
    handler: buildAddBtStrategyController({ btStrategyModelDao, dateService }),
  };
}
