import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { BnbSymbol } from '#features/shared/bnbSymbol.js';
import { ExchangeName } from '#features/shared/exchange.js';
import { createSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { ValidDate } from '#shared/utils/date.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BtStrategyId } from '../dataModels/btStrategy.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { AddBtStrategyControllerDeps, buildAddBtStrategyController } from './controller.js';

function mockDeps(overrides?: DeepPartial<AddBtStrategyControllerDeps>): AddBtStrategyControllerDeps {
  return mergeDeepRight(
    {
      dateService: { getCurrentDate: () => new Date('2010-10-20') },
      symbolDao: { getByNameAndExchange: () => te.right(true) },
      btStrategyDao: { generateId: () => 'MYpbzjjjCT', add: () => te.right(undefined) },
    },
    overrides ?? {},
  ) as AddBtStrategyControllerDeps;
}
function mockValidSymbol(body: { symbol: string; exchange: string; capitalCurrency: string }): BnbSymbol {
  return mockBnbSymbol({
    name: body.symbol,
    exchange: body.exchange as ExchangeName,
    baseAsset: body.capitalCurrency,
  });
}

const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;
const setupServer = setupTestServer(method, url, buildAddBtStrategyController, mockDeps);

describe('[GIVEN] request body is valid', () => {
  describe('[WHEN] user sends a request to add a backtesting strategy', () => {
    it('[THEN] it will return HTTP201 and response body with the created backtesting strategy ID and timestamp', async () => {
      const body = mockValidAddBtStrategyRequestBody({
        startTimestamp: new Date('2011-03-04'),
        endTimestamp: new Date('2011-03-05'),
      });
      const currentDate = new Date('2011-03-10') as ValidDate;
      const id = 'NBQPCl2Dga' as BtStrategyId;
      const httpServer = setupServer({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: () => te.right(mockValidSymbol(body)) },
        btStrategyDao: { generateId: () => id },
      });

      const resp = await httpServer.inject({ method, url, body });

      expect(resp.statusCode).toBe(201);
      expect(resp.json()).toEqual({ id, createdAt: currentDate.toISOString() });
    });
  });
});

describe('[GIVEN] request body is invalid format', () => {
  describe('[WHEN] user sends a request to add a backtesting strategy', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const body = { ...mockValidAddBtStrategyRequestBody(), invalid: 'invalid' };
      const httpServer = setupServer({
        symbolDao: { getByNameAndExchange: () => te.right(mockValidSymbol(body)) },
      });

      const resp = await httpServer.inject({ method, url, body });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the symbol that user want does not exist', () => {
  describe('[WHEN] user sends a request to add a backtesting strategy', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const error = createSymbolDaoError('NotExist', 'Mock');
      const httpServer = setupServer({ symbolDao: { getByNameAndExchange: () => te.left(error) } });

      const resp = await httpServer.inject({ method, url, body: mockValidAddBtStrategyRequestBody() });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the capital currency does not match neither base asset nor quote asset of symbol', () => {
  describe('[WHEN] user sends a request to add a backtesting strategy', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const body = mockValidAddBtStrategyRequestBody();
      const symbol = mockBnbSymbol({ name: body.symbol, exchange: body.exchange });
      const httpServer = setupServer({ symbolDao: { getByNameAndExchange: () => te.right(symbol) } });

      const resp = await httpServer.inject({ method, url, body });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] DAO fails to get the symbol', () => {
  describe('[WHEN] user sends a request to add a backtesting strategy', () => {
    it('[THEN] it will return HTTP500 and error response body', async () => {
      const error = createSymbolDaoError('GetByNameAndExchangeFailed', 'Mock');
      const httpServer = setupServer({ symbolDao: { getByNameAndExchange: () => te.left(error) } });

      const resp = await httpServer.inject({ method, url, body: mockValidAddBtStrategyRequestBody() });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] request body contains invalid data', () => {
  describe('[WHEN] user sends a request to add a backtesting strategy', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const body = { ...mockValidAddBtStrategyRequestBody(), maxNumKlines: 0.1 };
      const httpServer = setupServer({
        symbolDao: { getByNameAndExchange: () => te.right(mockValidSymbol(body)) },
      });

      const resp = await httpServer.inject({ method, url, body });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] DAO fails to add the backtesting strategy', () => {
  describe('[WHEN] user sends a request to add a backtesting strategy', () => {
    it('[THEN] it will return HTTP500 and error response body', async () => {
      const body = mockValidAddBtStrategyRequestBody({
        startTimestamp: new Date('2011-03-04'),
        endTimestamp: new Date('2011-03-05'),
      });
      const currentDate = new Date('2011-03-10') as ValidDate;
      const error = createBtStrategyDaoError('AddFailed', 'Mock');
      const httpServer = setupServer({
        dateService: { getCurrentDate: () => currentDate },
        symbolDao: { getByNameAndExchange: () => te.right(mockValidSymbol(body)) },
        btStrategyDao: { add: () => te.left(error) },
      });

      const resp = await httpServer.inject({ method, url, body });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});
