import { RouteOptions } from 'fastify';

import { getSymbolModelByNameAndExchange } from '#features/symbols/DAOs/symbol.feature.js';
import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { addBtStrategyModel, generateBtStrategyModelId } from '../DAOs/btStrategy.feature.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildAddBtStrategyController } from './controller.js';

export function addBtStrategyRouteOptions(deps: AppDeps): RouteOptions {
  const { btStrategyDao, symbolDao, dateService } = deps;

  return {
    ...BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildAddBtStrategyController({
      dateService,
      symbolDao: { getByNameAndExchange: symbolDao.composeWith(getSymbolModelByNameAndExchange) },
      btStrategyDao: {
        generateId: generateBtStrategyModelId,
        add: btStrategyDao.composeWith(addBtStrategyModel),
      },
    }),
  };
}
