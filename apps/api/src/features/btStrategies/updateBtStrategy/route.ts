import { RouteOptions } from 'fastify';

import { getSymbolModelByNameAndExchange } from '#features/symbols/DAOs/symbol.feature.js';
import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { updateBtStrategyById } from '../DAOs/btStrategy.feature.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildUpdateBtStrategyController } from './controller.js';

export function updateBtStrategyRouteOptions(deps: AppDeps): RouteOptions {
  const { btStrategyDao, symbolDao, dateService } = deps;

  return {
    ...BT_STRATEGY_ENDPOINTS.UPDATE_BT_STRATEGY,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildUpdateBtStrategyController({
      dateService,
      symbolDao: { getByNameAndExchange: symbolDao.composeWith(getSymbolModelByNameAndExchange) },
      btStrategyDao: { updateById: btStrategyDao.composeWith(updateBtStrategyById) },
    }),
  };
}
