import { RouteOptions } from 'fastify';

import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { getLastBtExecutionProgress } from '../DAOs/btExecution.feature.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildGetLastBtExecutionProgressController } from './controller.js';

export function getLastBtExecutionProgressRouteOptions(deps: AppDeps): RouteOptions {
  const { btExecutionDao } = deps;
  return {
    ...BT_STRATEGY_ENDPOINTS.GET_LAST_EXECUTION_PROGRESS,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildGetLastBtExecutionProgressController({
      getLastBtExecutionProgress: btExecutionDao.composeWith(getLastBtExecutionProgress),
    }),
  };
}
