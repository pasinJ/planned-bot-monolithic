import { RouteOptions } from 'fastify';

import { onSendHook, preValidationHook } from '#infra/http/hooks.js';
import { AppDeps } from '#shared/appDeps.type.js';

import { existBtStrategyModelById } from '../DAOs/btStrategy.feature.js';
import { generateBtExecutionId } from '../dataModels/btExecution.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { scheduleBtJob } from './backtesting.job.js';
import { buildExecuteBtStrategyController } from './controller.js';

export function executeBtStrategyRouteOptions(deps: AppDeps): RouteOptions {
  const { btStrategyDao, jobScheduler, dateService } = deps;
  return {
    ...BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildExecuteBtStrategyController({
      btStrategyDao: { existById: btStrategyDao.composeWith(existBtStrategyModelById) },
      btJobScheduler: {
        scheduleBtJob: jobScheduler.composeWith(
          scheduleBtJob({ dateService, btExecutionDao: { generateId: generateBtExecutionId } }),
        ),
      },
    }),
  };
}
