import { BT_STRATEGY_ENDPOINTS } from '#features/btStrategies/routes.constant.js';
import { randomString } from '#test-utils/faker/string.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';

import { client } from './httpClient.js';

export async function addBtStrategy(body: Record<string, unknown> = mockValidAddBtStrategyRequestBody()) {
  const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;
  return { request: { body }, response: await client.request({ method, url, data: body }) };
}

export async function executeBtStrategy(btStrategyId: string = randomString()) {
  const { method, url } = BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY;
  return {
    request: { id: btStrategyId },
    response: await client.request({ method, url: url.replace(':id', btStrategyId), data: {} }),
  };
}
