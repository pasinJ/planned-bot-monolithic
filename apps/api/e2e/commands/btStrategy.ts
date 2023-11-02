import { BT_STRATEGY_ENDPOINTS } from '#features/btStrategies/routes.constant.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';

import { client } from './httpClient.js';

export async function addBtStrategy(body: Record<string, unknown> = mockValidAddBtStrategyRequestBody()) {
  const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;
  return { request: { body }, response: await client.request({ method, url, data: body }) };
}

export async function updateBtStrategy(btStrategyId: string, body: Record<string, unknown>) {
  const { method, url: urlTemplate } = BT_STRATEGY_ENDPOINTS.UPDATE_BT_STRATEGY;
  const url = urlTemplate.replace(':btStrategyId', btStrategyId);

  return { request: { body }, response: await client.request({ method, url, data: body }) };
}

export async function executeBtStrategy(btStrategyId = 'IP3t1OJ5Cd') {
  const { method, url } = BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY;
  return {
    request: { id: btStrategyId },
    response: await client.request({ method, url: url.replace(':btStrategyId', btStrategyId), data: {} }),
  };
}

export async function getBtExecutionProgressById(btStrategyId = 'eOZ27sKqgq', btExecutionId = 'n_D65q3SUG') {
  const { method, url } = BT_STRATEGY_ENDPOINTS.GET_BT_PROGRESS;
  return {
    request: { id: btExecutionId },
    response: await client.request({
      method,
      url: url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', btExecutionId),
      data: {},
    }),
  };
}

export async function getBtExecutionResultById(btStrategyId = 'eOZ27sKqgq', btExecutionId = '9IDRGAts6A') {
  const { method, url } = BT_STRATEGY_ENDPOINTS.GET_BT_RESULT;
  return {
    request: { id: btExecutionId },
    response: await client.request({
      method,
      url: url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', btExecutionId),
      data: {},
    }),
  };
}
