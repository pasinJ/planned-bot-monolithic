import eUtils from 'fp-ts-std/Either';
import te from 'fp-ts/lib/TaskEither.js';

import { buildHttpServer } from '#infra/http/server.js';
import { createMainLogger } from '#infra/logging.js';
import { unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { anyString, randomAnyDate, randomBeforeAndAfterDate } from '#test-utils/faker.js';
import { mockBtStrategyRepo } from '#test-utils/features/btStrategies/repositories.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/requests.js';
import { addRoute } from '#test-utils/mockServer.js';
import { mockDateService, mockIdService } from '#test-utils/mockService.js';

import { AddBtStrategyError } from '../btStrategy.repository.type.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { AddBtStrategyControllerDeps, buildAddBtStrategyController } from './addBtStrategy.js';

const { method, url } = BT_STRATEGY_ENDPOINTS.ADD_BT_STRATEGY;
const logger = createMainLogger();

function mockDeps(overrides?: Partial<AddBtStrategyControllerDeps>): AddBtStrategyControllerDeps {
  return {
    btStrategyRepo: mockBtStrategyRepo(),
    dateService: mockDateService(),
    idService: mockIdService(),
    ...overrides,
  };
}
function setupSuccessfullyCreate() {
  const httpServer = eUtils.unsafeUnwrap(buildHttpServer(logger));
  const id = anyString();
  const currentDate = randomAnyDate();
  const idService = mockIdService({ generateBtStrategyId: jest.fn().mockReturnValue(id) });
  const dateService = mockDateService({ getCurrentDate: jest.fn().mockReturnValue(currentDate) });
  const deps = mockDeps({ idService, dateService });
  const handler = buildAddBtStrategyController(deps);

  addRoute(httpServer, { method, url, handler });

  return { httpServer, id, currentDate };
}
function setupRepoError() {
  const httpServer = unsafeUnwrapEitherRight(buildHttpServer(logger));
  const btStrategyRepo = mockBtStrategyRepo({
    add: jest.fn().mockReturnValue(te.left(new AddBtStrategyError())),
  });
  const deps = mockDeps({ btStrategyRepo });
  const handler = buildAddBtStrategyController(deps);

  addRoute(httpServer, { method, url, handler });

  return httpServer;
}

describe('WHEN user successfully add a backtesting strategy', () => {
  it('THEN it should return HTTP201 and the added backtesting strategy', async () => {
    const { httpServer, id, currentDate } = setupSuccessfullyCreate();

    const body = mockValidAddBtStrategyRequestBody();
    const resp = await httpServer.inject({ method, url, body });
    const respBody = resp.json();

    expect(resp.statusCode).toBe(201);
    expect(respBody).toEqual(
      expect.objectContaining({
        ...body,
        id: id,
        createdAt: currentDate.toJSON(),
        updatedAt: currentDate.toJSON(),
      }),
    );
  });
});

describe('WHEN user try to add a backtesting strategy with invalid request body', () => {
  it('THEN it should return HTTP400 and error response body', async () => {
    const { httpServer } = setupSuccessfullyCreate();

    const body = { ...mockValidAddBtStrategyRequestBody(), invalid: 'invalid' };
    const resp = await httpServer.inject({ method, url, body });
    const respBody = resp.json();

    expect(resp.statusCode).toBe(400);
    expect(respBody).toEqual(toBeHttpErrorResponse);
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
    const respBody = resp.json();

    expect(resp.statusCode).toBe(400);
    expect(respBody).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN repository fails to add the backtesting strategy', () => {
  it('THEN it should return HTTP500 and error response body', async () => {
    const httpServer = setupRepoError();

    const resp = await httpServer.inject({ method, url, body: mockValidAddBtStrategyRequestBody() });
    const respBody = resp.json();

    expect(resp.statusCode).toBe(500);
    expect(respBody).toEqual(toBeHttpErrorResponse);
  });
});
