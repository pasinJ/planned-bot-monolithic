import { RouteOptions } from 'fastify';

import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { getBtStrategies } from '../DAOs/btStrategy.feature.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildGetBtStrategiesController } from './controller.js';

export function getBtStrategiesRouteOptions(deps: AppDeps): RouteOptions {
  const { btStrategyDao } = deps;
  return {
    ...BT_STRATEGY_ENDPOINTS.GET_BT_STRATEGIES,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildGetBtStrategiesController({
      getBtStrategies: btStrategyDao.composeWith(getBtStrategies),
    }),
  };
}
