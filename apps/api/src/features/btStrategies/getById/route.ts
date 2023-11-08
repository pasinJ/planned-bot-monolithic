import { RouteOptions } from 'fastify';

import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { getBtStrategyModelById } from '../DAOs/btStrategy.feature.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildGetBtStrategyController } from './controller.js';

export function getBtStrategyRouteOptions(deps: AppDeps): RouteOptions {
  const { btStrategyDao } = deps;
  return {
    ...BT_STRATEGY_ENDPOINTS.GET_BT_STRATEGY,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildGetBtStrategyController({
      getBtStrategyById: btStrategyDao.composeWith(getBtStrategyModelById),
    }),
  };
}
