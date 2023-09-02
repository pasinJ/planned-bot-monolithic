import { BT_STRATEGY_ENDPOINTS } from '#features/backtesting-strategies/routes.constant.js';

import { client } from './httpClient.js';

export function addBtStrategy(body: Record<string, unknown>) {
  const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;
  return client.request({ method, url, data: body });
}
