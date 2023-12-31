import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockBtExecutionProgress } from '#test-utils/features/btStrategies/btExecution.js';
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
  >({ btExecutionDao: { getProgressById: () => te.right(mockBtExecutionProgress()) } }, overrides ?? {});
}

const { method, url } = BT_STRATEGY_ENDPOINTS.GET_BT_PROGRESS;
const setupServer = setupTestServer(method, url, buildGetBtExecutionProgressController, mockDeps);
const btStrategyId = '290FQtHEQX';
const anyBtExecutionId = 'jOWOiJ5GLZ';

describe('[GIVEN] user send an empty string as backtesting strategy ID or execution ID', () => {
  describe('[WHEN] user send a request to get backtesting execution progress', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const getProgressUrl = url.replace(':btStrategyId', '').replace(':btExecutionId', anyBtExecutionId);
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
      const getProgressUrl = url
        .replace(':btStrategyId', btStrategyId)
        .replace(':btExecutionId', anyBtExecutionId);
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
      const getProgressUrl = url
        .replace(':btStrategyId', btStrategyId)
        .replace(':btExecutionId', anyBtExecutionId);
      const error = createBtExecutionDaoError('GetProgressByIdFailed', 'Mock');
      const httpServer = setupServer({ btExecutionDao: { getProgressById: () => te.left(error) } });

      const resp = await httpServer.inject({ method, url: getProgressUrl });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the execution ID exists', () => {
  describe('[WHEN] user send a request to get backtesting execution progress', () => {
    it('[THEN] it will return HTTP200 and progress information in response body', async () => {
      const btExecutionProgress = mockBtExecutionProgress();
      const getProgressUrl = url
        .replace(':btStrategyId', btStrategyId)
        .replace(':btExecutionId', btExecutionProgress.id);
      const httpServer = setupServer({
        btExecutionDao: { getProgressById: () => te.right(btExecutionProgress) },
      });

      const resp = await httpServer.inject({ method, url: getProgressUrl });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toEqual(btExecutionProgress);
    });
  });
});
