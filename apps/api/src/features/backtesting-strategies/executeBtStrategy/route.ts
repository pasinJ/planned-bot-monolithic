import { RouteOptions } from 'fastify';

import { commonHooksForAppRoutes } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildBtJobScheduler } from '../services/jobScheduler.js';
import { buildExecuteBtStrategyController } from './controller.js';

export function executeBtStrategyRouteOptions(deps: AppDeps): RouteOptions {
  const { btStrategyModelDao, jobScheduler } = deps;
  return {
    ...BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY,
    ...commonHooksForAppRoutes,
    handler: buildExecuteBtStrategyController({
      btStrategyModelDao,
      btJobScheduler: buildBtJobScheduler(jobScheduler),
    }),
  };
}
