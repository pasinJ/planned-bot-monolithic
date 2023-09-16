import { RouteOptions } from 'fastify';

import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { getAllSymbolModels } from '../DAOs/symbol.feature.js';
import { SYMBOLS_ENDPOINTS } from '../routes.constant.js';
import { buildGetSymbolsController } from './controller.js';

export function getSymbolsRouteOptions(deps: AppDeps): RouteOptions {
  const { symbolDao } = deps;

  return {
    ...SYMBOLS_ENDPOINTS.GET_SYMBOLS,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildGetSymbolsController({ symbolDao: { getAll: symbolDao.composeWith(getAllSymbolModels) } }),
  };
}
