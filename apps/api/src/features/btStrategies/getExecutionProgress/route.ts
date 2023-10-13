import { RouteOptions } from 'fastify';

import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { getBtExecutionProgressById } from '../DAOs/btExecution.feature.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildGetBtExecutionProgressController } from './controller.js';

export function getBtExecutionProgressRouteOptions(deps: AppDeps): RouteOptions {
  const { btExecutionDao } = deps;
  return {
    ...BT_STRATEGY_ENDPOINTS.GET_BT_PROGRESS,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildGetBtExecutionProgressController({
      btExecutionDao: { getProgressById: btExecutionDao.composeWith(getBtExecutionProgressById) },
    }),
  };
}
