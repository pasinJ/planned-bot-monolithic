import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { buildGetBtExecutionResultController } from './controller.js';

const { method, url } = BT_STRATEGY_ENDPOINTS.GET_BT_RESULT;
const setupServer = setupTestServer(method, url, buildGetBtExecutionResultController, () => ({}));

describe('[GIVEN] user send an empty string as execution ID', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const getResultUrl = url.replace(':id', '');
      const httpServer = setupServer();

      const resp = await httpServer.inject({ method, url: getResultUrl });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});
