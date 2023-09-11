import { BT_STRATEGY_ENDPOINTS } from '#features/backtesting-strategies/routes.constant.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/requests.js';

import { client } from './httpClient.js';

export async function addBtStrategy(body: Record<string, unknown> = mockValidAddBtStrategyRequestBody()) {
  const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;
  return { request: { body }, response: await client.request({ method, url, data: body }) };
}
