import { RouteOptions } from 'fastify';

import { generateOrderId } from '#features/shared/order.js';
import { generateTradeId } from '#features/shared/trade.js';
import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { getBtExecutionResultById } from '../DAOs/btExecution.feature.js';
import { getBtStrategyModelById } from '../DAOs/btStrategy.feature.js';
import { getLastKlineBefore } from '../DAOs/kline.feature.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildGetBtExecutionResultController } from './controller.js';

export function getBtExecutionResultRouteOptions(deps: AppDeps): RouteOptions {
  const { btExecutionDao, btStrategyDao, klineDao } = deps;

  return {
    ...BT_STRATEGY_ENDPOINTS.GET_BT_RESULT,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildGetBtExecutionResultController({
      btExecutionDao: { getResultById: btExecutionDao.composeWith(getBtExecutionResultById) },
      btStrategyDao: { getById: btStrategyDao.composeWith(getBtStrategyModelById) },
      klineDao: { getLastBefore: klineDao.composeWith(getLastKlineBefore) },
      generateOrderId,
      generateTradeId,
    }),
  };
}
