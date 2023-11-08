import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight, omit } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockBtStrategyModel } from '#test-utils/features/btStrategies/btStrategy.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { GetBtStrategyControllerDeps, buildGetBtStrategyController } from './controller.js';

function mockDeps(overrides?: DeepPartial<GetBtStrategyControllerDeps>): GetBtStrategyControllerDeps {
  return mergeDeepRight<GetBtStrategyControllerDeps, DeepPartial<GetBtStrategyControllerDeps>>(
    { getBtStrategyById: () => te.right(mockBtStrategyModel()) },
    overrides ?? {},
  );
}

const { method, url: urlTemplate } = BT_STRATEGY_ENDPOINTS.GET_BT_STRATEGY;
const setupServer = setupTestServer(method, urlTemplate, buildGetBtStrategyController, mockDeps);

describe('[GIVEN] user sends a request with an empty string as backtesting strategy ID params', () => {
  describe('[WHEN] get backtesting strategy', () => {
    it('[THEN] it will return HTTP400 with error response body', async () => {
      const httpServer = setupServer();
      const url = urlTemplate.replace(':btStrategyId', '');

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the backtesting strategy does not exist', () => {
  describe('[WHEN] get backtesting strategy', () => {
    it('[THEN] it will return HTTP404 with error response body', async () => {
      const error = createBtStrategyDaoError('NotExist', 'Mock');
      const httpServer = setupServer({ getBtStrategyById: () => te.left(error) });
      const url = urlTemplate.replace(':btStrategyId', 'QkUOqkoTLA');

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(404);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] getting the backtesting strategy fails', () => {
  describe('[WHEN] get backtesting strategy', () => {
    it('[THEN] it will return HTTP500 with error response body', async () => {
      const error = createBtStrategyDaoError('GetByIdFailed', 'Mock');
      const httpServer = setupServer({ getBtStrategyById: () => te.left(error) });
      const url = urlTemplate.replace(':btStrategyId', 'QkUOqkoTLA');

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] getting the backtesting strategy succeeds', () => {
  describe('[WHEN] get backtesting strategy', () => {
    it('[THEN] it will return HTTP200 with backtesting strategy', async () => {
      const btStrategy = mockBtStrategyModel();
      const httpServer = setupServer({ getBtStrategyById: () => te.right(btStrategy) });
      const url = urlTemplate.replace(':btStrategyId', 'QkUOqkoTLA');

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toEqual({
        ...omit(['startTimestamp', 'endTimestamp'], btStrategy),
        btRange: {
          start: btStrategy.startTimestamp.toISOString(),
          end: btStrategy.endTimestamp.toISOString(),
        },
        createdAt: btStrategy.createdAt.toISOString(),
        updatedAt: btStrategy.updatedAt.toISOString(),
      });
    });
  });
});
