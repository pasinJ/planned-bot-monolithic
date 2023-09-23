import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { ExchangeName } from '#features/shared/domain/exchange.js';
import { createSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { SymbolModel } from '#features/symbols/dataModels/symbol.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { randomDate, randomDateAfter } from '#test-utils/faker/date.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';
import { randomBtStrategyId } from '#test-utils/features/btStrategies/models.js';
import { mockSymbol } from '#test-utils/features/symbols/models.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { AddBtStrategyControllerDeps, buildAddBtStrategyController } from './controller.js';

function mockDeps(overrides?: DeepPartial<AddBtStrategyControllerDeps>): AddBtStrategyControllerDeps {
  return mergeDeepRight(
    {
      dateService: { getCurrentDate: () => randomDate() },
      symbolDao: { getByNameAndExchange: () => te.right(true) },
      btStrategyDao: { generateId: () => randomBtStrategyId(), add: () => te.right(undefined) },
    },
    overrides ?? {},
  ) as AddBtStrategyControllerDeps;
}
function mockValidSymbol(body: { symbol: string; exchange: ExchangeName; currency: string }): SymbolModel {
  return mockSymbol({ name: body.symbol, exchange: body.exchange, baseAsset: body.currency });
}

const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;
const setupServer = setupTestServer(method, url, buildAddBtStrategyController, mockDeps);

describe('[WHEN] user sends a valid request to add a backtesting strategy', () => {
  it('[THEN] it will return HTTP201 and response body with the created backtesting strategy ID and timestamp', async () => {
    const body = mockValidAddBtStrategyRequestBody();
    const currentDate = randomDateAfter(new Date(body.endTimestamp));
    const id = randomBtStrategyId();
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

describe('[WHEN] user sends a request with invalid request body to add a backtesting strategy', () => {
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

describe('[WHEN] user sends a request to add a backtesting strategy with not existing symbol', () => {
  it('[THEN] it will return HTTP400 and error response body', async () => {
    const error = createSymbolDaoError('NotExist', 'Mock');
    const httpServer = setupServer({ symbolDao: { getByNameAndExchange: () => te.left(error) } });

    const resp = await httpServer.inject({ method, url, body: mockValidAddBtStrategyRequestBody() });

    expect(resp.statusCode).toBe(400);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('[WHEN] user sends a request to add a backtesting strategy with currency that do not match neither base asset nor quote asset of symbol', () => {
  it('[THEN] it will return HTTP400 and error response body', async () => {
    const body = mockValidAddBtStrategyRequestBody();
    const symbol = mockSymbol({ name: body.symbol, exchange: body.exchange });
    const httpServer = setupServer({ symbolDao: { getByNameAndExchange: () => te.right(symbol) } });

    const resp = await httpServer.inject({ method, url, body });

    expect(resp.statusCode).toBe(400);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('[WHEN] user sends a valid request to add a backtesting strategy [BUT] DAO fails to get symbol', () => {
  it('[THEN] it will return HTTP500 and error response body', async () => {
    const error = createSymbolDaoError('GetByNameAndExchangeFailed', 'Mock');
    const httpServer = setupServer({ symbolDao: { getByNameAndExchange: () => te.left(error) } });

    const resp = await httpServer.inject({ method, url, body: mockValidAddBtStrategyRequestBody() });

    expect(resp.statusCode).toBe(500);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('[WHEN] user sends a request with invalid data to add a backtesting strategy', () => {
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

describe('[WHEN] user sends a valid request to add a backtesting strategy [BUT] DAO fails to add the backtesting strategy', () => {
  it('[THEN] it will return HTTP500 and error response body', async () => {
    const body = mockValidAddBtStrategyRequestBody();
    const currentDate = randomDateAfter(new Date(body.endTimestamp));
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
