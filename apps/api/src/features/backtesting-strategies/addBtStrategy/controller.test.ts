import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';

import { createSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { DeepPartial } from '#shared/helpers.type.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { randomAnyDate, randomBeforeAndAfterDate, randomString } from '#test-utils/faker.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/requests.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { AddBtStrategyControllerDeps, buildAddBtStrategyController } from './controller.js';

function mockDeps(overrides?: DeepPartial<AddBtStrategyControllerDeps>): AddBtStrategyControllerDeps {
  return mergeDeepRight(
    {
      dateService: { getCurrentDate: () => randomAnyDate() },
      symbolDao: { existByNameAndExchange: () => te.right(true) },
      btStrategyDao: { generateId: () => randomString(), add: () => te.right(undefined) },
    },
    overrides ?? {},
  ) as AddBtStrategyControllerDeps;
}

const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;
const setupServer = setupTestServer(method, url, buildAddBtStrategyController, mockDeps);

describe('WHEN user successfully add a backtesting strategy', () => {
  it('THEN it should return HTTP201 and the created backtesting strategy ID and timestamp', async () => {
    const id = randomString();
    const currentDate = randomAnyDate();
    const httpServer = setupServer({
      dateService: { getCurrentDate: () => currentDate },
      btStrategyDao: { generateId: () => id },
    });

    const resp = await httpServer.inject({ method, url, body: mockValidAddBtStrategyRequestBody() });

    expect(resp.statusCode).toBe(201);
    expect(resp.json()).toEqual({ id, createdAt: currentDate.toJSON() });
  });
});

describe('WHEN user request to add a backtesting strategy with invalid request body', () => {
  it('THEN it should return HTTP400 and error response body', async () => {
    const httpServer = setupServer();

    const body = { ...mockValidAddBtStrategyRequestBody(), invalid: 'invalid' };
    const resp = await httpServer.inject({ method, url, body });

    expect(resp.statusCode).toBe(400);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN user request with not exist symbol', () => {
  it('THEN it should return HTTP400 and error response body', async () => {
    const httpServer = setupServer({ symbolDao: { existByNameAndExchange: () => te.right(false) } });

    const resp = await httpServer.inject({ method, url, body: mockValidAddBtStrategyRequestBody() });

    expect(resp.statusCode).toBe(400);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN user request to add a backtesting strategy with invalid data', () => {
  it('THEN it should return HTTP400 and error response body', async () => {
    const httpServer = setupServer();

    const { before, after } = randomBeforeAndAfterDate();
    const body = {
      ...mockValidAddBtStrategyRequestBody(),
      startTimestamp: after.toJSON(),
      endTimestamp: before.toJSON(),
    };
    const resp = await httpServer.inject({ method, url, body });

    expect(resp.statusCode).toBe(400);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN checking symbol name fails', () => {
  it('THEN it should return HTTP500 and error response body', async () => {
    const error = createSymbolDaoError('ExistByNameAndExchangeFailed', 'Mock');
    const httpServer = setupServer({ symbolDao: { existByNameAndExchange: () => te.left(error) } });

    const resp = await httpServer.inject({ method, url, body: mockValidAddBtStrategyRequestBody() });

    expect(resp.statusCode).toBe(500);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN adding the backtesting strategy fails', () => {
  it('THEN it should return HTTP500 and error response body', async () => {
    const error = createBtStrategyDaoError('AddFailed', 'Mock');
    const httpServer = setupServer({ btStrategyDao: { add: () => te.left(error) } });

    const resp = await httpServer.inject({ method, url, body: mockValidAddBtStrategyRequestBody() });

    expect(resp.statusCode).toBe(500);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});
