import { RouteOptions } from 'fastify';

import { commonHooksForAppRoutes } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { SYMBOLS_ENDPOINTS } from '../routes.constant.js';
import { buildGetSymbolsController } from './controller.js';

export function getSymbolsRouteOptions(deps: AppDeps): RouteOptions {
  const { symbolModelDao } = deps;

  return {
    ...SYMBOLS_ENDPOINTS.GET_SYMBOLS,
    ...commonHooksForAppRoutes,
    handler: buildGetSymbolsController({ symbolModelDao }),
  };
}
