import { RouteOptions } from 'fastify';

import { onSendHook, preValidationHook } from '#infra/http/hooks.js';

import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildGetBtExecutionResultController } from './controller.js';

export function getBtExecutionResultRouteOptions(): RouteOptions {
  return {
    ...BT_STRATEGY_ENDPOINTS.GET_BT_RESULT,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildGetBtExecutionResultController(),
  };
}
