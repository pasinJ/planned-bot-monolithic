import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { KLINE_ENDPOINTS } from '../routes.constant.js';
import { buildGetKlinesByParamsController } from './controller.js';

const { method, url } = KLINE_ENDPOINTS.GET_BY_PARAMS;
const setupServer = setupTestServer(method, url, buildGetKlinesByParamsController, () => undefined);

describe('[GIVEN] user sends request without exchange, symbol, timeframe, start timestamp and end timestamp params', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will return HTTP400 with error response', async () => {
      const httpServer = setupServer();
      const params = { startTimestamp: new Date('2010-10-03').toISOString() };

      const resp = await httpServer.inject({ method, url, query: params });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});
