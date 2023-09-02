import te from 'fp-ts/lib/TaskEither.js';

import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { randomAnyDate, randomBeforeAndAfterDate, randomString } from '#test-utils/faker.js';
import { mockBtStrategyRepo } from '#test-utils/features/btStrategies/repositories.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/requests.js';
import { setupTestServer } from '#test-utils/httpServer.js';
import { mockDateService, mockIdService } from '#test-utils/services.js';

import { AddBtStrategyError } from '../btStrategy.repository.type.js';
import { executionStatusEnum } from '../domain/btStrategy.entity.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { AddBtStrategyControllerDeps, buildAddBtStrategyController } from './addBtStrategy.js';

const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;
const setupServer = setupTestServer(method, url, buildAddBtStrategyController, mockDeps);

function mockDeps(overrides?: Partial<AddBtStrategyControllerDeps>): AddBtStrategyControllerDeps {
  return {
    btStrategyRepo: mockBtStrategyRepo(),
    dateService: mockDateService(),
    idService: mockIdService(),
    ...overrides,
  };
}
function setupSuccessfullyCreate() {
  const id = randomString();
  const currentDate = randomAnyDate();
  const idService = mockIdService({ generateBtStrategyId: jest.fn().mockReturnValue(id) });
  const dateService = mockDateService({ getCurrentDate: jest.fn().mockReturnValue(currentDate) });

  return { httpServer: setupServer({ idService, dateService }), id, currentDate };
}
function setupRepoError() {
  const btStrategyRepo = mockBtStrategyRepo({
    add: jest.fn().mockReturnValue(te.left(new AddBtStrategyError())),
  });

  return setupServer({ btStrategyRepo });
}

describe('WHEN user successfully add a backtesting strategy', () => {
  it('THEN it should return HTTP201 and the added backtesting strategy', async () => {
    const { httpServer, id, currentDate } = setupSuccessfullyCreate();

    const body = mockValidAddBtStrategyRequestBody();
    const resp = await httpServer.inject({ method, url, body });

    try {
      expect(resp.statusCode).toBe(201);
      expect(resp.json()).toEqual(
        expect.objectContaining({
          ...body,
          id: id,
          executionStatus: executionStatusEnum.IDLE,
          createdAt: currentDate.toJSON(),
          updatedAt: currentDate.toJSON(),
        }),
      );
    } catch (e) {
      console.error(e);
      console.error(body);
      console.error(resp.json());
    }
  });
});

describe('WHEN user try to add a backtesting strategy with invalid request body', () => {
  it('THEN it should return HTTP400 and error response body', async () => {
    const { httpServer } = setupSuccessfullyCreate();

    const body = { ...mockValidAddBtStrategyRequestBody(), invalid: 'invalid' };
    const resp = await httpServer.inject({ method, url, body });

    expect(resp.statusCode).toBe(400);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN user try to add a backtesting strategy with invalid data', () => {
  it('THEN it should return HTTP400 and error response body', async () => {
    const { httpServer } = setupSuccessfullyCreate();

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

describe('WHEN repository fails to add the backtesting strategy', () => {
  it('THEN it should return HTTP500 and error response body', async () => {
    const httpServer = setupRepoError();

    const resp = await httpServer.inject({ method, url, body: mockValidAddBtStrategyRequestBody() });

    expect(resp.statusCode).toBe(500);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});
