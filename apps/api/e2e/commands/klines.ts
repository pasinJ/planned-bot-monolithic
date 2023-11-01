import { KLINE_ENDPOINTS } from '#features/klines/routes.constant.js';

import { client } from './httpClient.js';

export async function getKlinesByQuery(query: Record<string, unknown>) {
  const { method, url } = KLINE_ENDPOINTS.GET_BY_PARAMS;
  return { response: await client.request({ method, url, params: query }) };
}
