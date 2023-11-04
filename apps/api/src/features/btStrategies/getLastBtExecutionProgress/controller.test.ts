import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createBtExecutionDaoError } from '../DAOs/btExecution.error.js';
import { BtExecutionId, BtExecutionProgress, BtProgressPercentage } from '../dataModels/btExecution.js';
import { BtStrategyId } from '../dataModels/btStrategy.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import {
  GetLastBtExecutionProgressControllerDeps,
  buildGetLastBtExecutionProgressController,
} from './controller.js';

function mockDeps(
  overrides?: DeepPartial<GetLastBtExecutionProgressControllerDeps>,
): GetLastBtExecutionProgressControllerDeps {
  return mergeDeepRight<
    GetLastBtExecutionProgressControllerDeps,
    DeepPartial<GetLastBtExecutionProgressControllerDeps>
  >({ getLastBtExecutionProgress: () => te.right(null) }, overrides ?? {});
}

const { method, url: urlTemplate } = BT_STRATEGY_ENDPOINTS.GET_LAST_EXECUTION_PROGRESS;
const setupServer = setupTestServer(method, urlTemplate, buildGetLastBtExecutionProgressController, mockDeps);

describe('[GIVEN] user sends a request with an empty string as backtesting strategy ID params', () => {
  describe('[WHEN] get the last execution progress of backtesting strategy', () => {
    it('[THEN] it will return HTTP400 with error response body', async () => {
      const httpServer = setupServer();
      const url = urlTemplate.replace(':btStrategyId', '');

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the last execution progress of backtesting strategy does not exist', () => {
  describe('[WHEN] get the last execution progress of backtesting strategy', () => {
    it('[THEN] it will return HTTP200 with null response body', async () => {
      const httpServer = setupServer({ getLastBtExecutionProgress: () => te.right(null) });
      const url = urlTemplate.replace(':btStrategyId', 'QkUOqkoTLA');

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toBeNull();
    });
  });
});

describe('[GIVEN] the last execution progress of backtesting strategy exists', () => {
  describe('[WHEN] get the last execution progress of backtesting strategy', () => {
    it('[THEN] it will return HTTP200 with the last execution progress', async () => {
      const lastExecutionProgress: BtExecutionProgress = {
        id: 'mcEwMeKYOm' as BtExecutionId,
        btStrategyId: 'QkUOqkoTLA' as BtStrategyId,
        status: 'FINISHED',
        percentage: 100 as BtProgressPercentage,
        logs: ['log'],
      };
      const httpServer = setupServer({ getLastBtExecutionProgress: () => te.right(lastExecutionProgress) });
      const url = urlTemplate.replace(':btStrategyId', 'QkUOqkoTLA');

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toEqual(lastExecutionProgress);
    });
  });
});

describe('[GIVEN] getting the last execution progress fails', () => {
  describe('[WHEN] get the last execution progress of backtesting strategy', () => {
    it('[THEN] it will return HTTP500 with error response body', async () => {
      const error = createBtExecutionDaoError('GetLastBtExecutionProgressFailed', 'Mock');
      const httpServer = setupServer({ getLastBtExecutionProgress: () => te.left(error) });
      const url = urlTemplate.replace(':btStrategyId', 'QkUOqkoTLA');

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});
