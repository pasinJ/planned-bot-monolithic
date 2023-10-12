import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createBtExecutionDaoError } from '../DAOs/btExecution.error.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { GetBtExecutionProgressControllerDeps, buildGetBtExecutionProgressController } from './controller.js';

function mockDeps(
  overrides?: DeepPartial<GetBtExecutionProgressControllerDeps>,
): GetBtExecutionProgressControllerDeps {
  return mergeDeepRight<
    GetBtExecutionProgressControllerDeps,
    DeepPartial<GetBtExecutionProgressControllerDeps>
  >(
    { btExecutionDao: { getProgressById: () => te.left(createBtExecutionDaoError('NotExist', 'Mock')) } },
    overrides ?? {},
  );
}

const { method, url } = BT_STRATEGY_ENDPOINTS.GET_BT_PROGRESS;
const setupServer = setupTestServer(method, url, buildGetBtExecutionProgressController, mockDeps);
const anyBtExecutionId = 'jOWOiJ5GLZ';

describe('[GIVEN] user send an empty string as execution ID', () => {
  describe('[WHEN] user send a request to get backtesting execution progress', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const getProgressUrl = url.replace(':id', '');
      const httpServer = setupServer();

      const resp = await httpServer.inject({ method, url: getProgressUrl });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the execution ID does not exist', () => {
  describe('[WHEN] user send a request to get backtesting execution progress', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const getProgressUrl = url.replace(':id', anyBtExecutionId);
      const error = createBtExecutionDaoError('NotExist', 'Mock');
      const httpServer = setupServer({ btExecutionDao: { getProgressById: () => te.left(error) } });

      const resp = await httpServer.inject({ method, url: getProgressUrl });

      expect(resp.statusCode).toBe(404);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] Bt execution DAO fails to get progress from database', () => {
  describe('[WHEN] user send a request to get backtesting execution progress', () => {
    it('[THEN] it will return HTTP500 and error response body', async () => {
      const getProgressUrl = url.replace(':id', anyBtExecutionId);
      const error = createBtExecutionDaoError('GetProgressByIdFailed', 'Mock');
      const httpServer = setupServer({ btExecutionDao: { getProgressById: () => te.left(error) } });

      const resp = await httpServer.inject({ method, url: getProgressUrl });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});
