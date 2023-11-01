import { RouteOptions } from 'fastify';

import { onSendHook, preValidationHook } from '#infra/http/hooks.js';

import { KLINE_ENDPOINTS } from '../routes.constant.js';
import { buildGetKlinesByParamsController } from './controller.js';

export function getKlinesByParamsRouteOptions(): RouteOptions {
  return {
    ...KLINE_ENDPOINTS.GET_BY_PARAMS,
    preValidation: preValidationHook,
    onSend: onSendHook,
    handler: buildGetKlinesByParamsController(),
  };
}
