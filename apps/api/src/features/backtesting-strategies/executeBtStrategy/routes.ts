import { RouteOptions } from 'fastify';

import { ApplicationDeps } from '#infra/applicationDeps.type.js';
import { commonHooksForAppRoutes } from '#infra/http/hooks.js';

import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildExecuteBtStrategyController } from './controller.js';

export function executeBtStrategyRouteOptions(deps: ApplicationDeps): RouteOptions {
  const { btStrategyModelDao, jobScheduler } = deps;
  return {
    ...BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY,
    ...commonHooksForAppRoutes,
    handler: buildExecuteBtStrategyController({ btStrategyModelDao, jobScheduler }),
  };
}
