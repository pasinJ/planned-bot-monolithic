import { RouteOptions } from 'fastify';

import { onSendHook, preValidationHook } from '#infra/http/hooks.js';

import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildGetBtExecutionProgressController } from './controller.js';

export function getBtExecutionProgressRouteOptions(): RouteOptions {
  return {
    ...BT_STRATEGY_ENDPOINTS.GET_BT_PROGRESS,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildGetBtExecutionProgressController(),
  };
}
