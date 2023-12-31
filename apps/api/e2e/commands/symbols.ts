import { SYMBOLS_ENDPOINTS } from '#features/symbols/routes.constant.js';

import { client } from './httpClient.js';

export function getSymbols() {
  const { method, url } = SYMBOLS_ENDPOINTS.GET_SYMBOLS;
  return client.request({ method, url });
}
