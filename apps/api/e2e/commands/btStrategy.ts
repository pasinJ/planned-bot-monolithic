import { BT_STRATEGY_ENDPOINTS } from '#features/btStrategies/routes.constant.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';

import { client } from './httpClient.js';

export async function addBtStrategy(body: Record<string, unknown> = mockValidAddBtStrategyRequestBody()) {
  const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;
  return { request: { body }, response: await client.request({ method, url, data: body }) };
}

export async function executeBtStrategy(btStrategyId = 'IP3t1OJ5Cd') {
  const { method, url } = BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY;
  return {
    request: { id: btStrategyId },
    response: await client.request({ method, url: url.replace(':id', btStrategyId), data: {} }),
  };
}

export async function getBtExecutionProgressById(executionId = 'n_D65q3SUG') {
  const { method, url } = BT_STRATEGY_ENDPOINTS.GET_BT_PROGRESS;
  return {
    request: { id: executionId },
    response: await client.request({ method, url: url.replace(':id', executionId), data: {} }),
  };
}
