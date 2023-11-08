import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { ValidDate } from '#SECT/date.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockValidUpdateBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { UpdateBtStrategyControllerDeps, buildUpdateBtStrategyController } from './controller.js';

function mockDeps(override?: DeepPartial<UpdateBtStrategyControllerDeps>): UpdateBtStrategyControllerDeps {
  return mergeDeepRight<UpdateBtStrategyControllerDeps, DeepPartial<UpdateBtStrategyControllerDeps>>(
    {
      dateService: { getCurrentDate: jest.fn().mockReturnValue(new Date('2010-03-04')) },
      symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
      btStrategyDao: { updateById: jest.fn().mockReturnValue(te.right(undefined)) },
    },
    override ?? {},
  );
}

const { method, url: urlTemplate } = BT_STRATEGY_ENDPOINTS.UPDATE_BT_STRATEGY;
const setupServer = setupTestServer(method, urlTemplate, buildUpdateBtStrategyController, mockDeps);

describe('[GIVEN] user sends a request with invalid request body', () => {
  describe('[WHEN] update backtesting strategy', () => {
    it('[THEN] it will return HTTP400 with error response body', async () => {
      const httpServer = setupServer();
      const body = { invalid: 1 };
      const btStrategyId = 'LQcrv65V2g';
      const url = urlTemplate.replace(':btStrategyId', btStrategyId);

      const resp = await httpServer.inject({ method, url, body });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] user sends a request with an empty string as backtesting strategy ID params', () => {
  describe('[WHEN] update backtesting strategy', () => {
    it('[THEN] it will return HTTP400 with error response body', async () => {
      const httpServer = setupServer();
      const body = mockValidUpdateBtStrategyRequestBody();
      const url = urlTemplate.replace(':btStrategyId', '');

      const resp = await httpServer.inject({ method, url, body });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] updating backtesting strategy succeeds', () => {
  describe('[WHEN] update backtesting strategy', () => {
    it('[THEN] it will return HTTP200 with updating timestamp', async () => {
      const currentDate = new Date('2022-04-06') as ValidDate;
      const symbol = mockBnbSymbol({ baseAsset: 'BTC', quoteAsset: 'USDT' });
      const httpServer = setupServer({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: () => te.right(symbol) },
        btStrategyDao: { updateById: () => te.right(undefined) },
      });
      const body = mockValidUpdateBtStrategyRequestBody({ assetCurrency: 'BTC', capitalCurrency: 'USDT' });
      const url = urlTemplate.replace(':btStrategyId', '0LzGK7YaVg');

      const resp = await httpServer.inject({ method, url, body });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toEqual({ updatedAt: currentDate.toISOString() });
    });
  });
});
