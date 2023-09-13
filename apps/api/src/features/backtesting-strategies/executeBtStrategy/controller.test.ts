import te from 'fp-ts/lib/TaskEither.js';

import { createJobSchedulerError } from '#infra/services/jobScheduler/service.error.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { randomAnyDate, randomString } from '#test-utils/faker.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createBtStrategyModelDaoError } from '../data-models/btStrategy.dao.error.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { ExecuteBtStrategyControllerDeps, buildExecuteBtStrategyController } from './controller.js';

function mockDeps(overrides?: Partial<ExecuteBtStrategyControllerDeps>): ExecuteBtStrategyControllerDeps {
  return {
    btStrategyModelDao: { existById: jest.fn().mockReturnValue(te.right(true)) },
    jobScheduler: {
      addBtJob: jest
        .fn()
        .mockReturnValue(te.right({ btExecutionId: randomString(), createdAt: randomAnyDate() })),
    },
    ...overrides,
  };
}
function setupNotExist() {
  const btStrategyModelDao = { existById: jest.fn().mockReturnValue(te.right(false)) };
  return setupServer({ btStrategyModelDao });
}
function setupCheckBtStrategyFailed() {
  const error = createBtStrategyModelDaoError('ExistByIdFailed', 'Mock');
  const btStrategyModelDao = { existById: jest.fn().mockReturnValue(te.left(error)) };
  return setupServer({ btStrategyModelDao });
}
function setupPendingOrRunningExist() {
  const error = createJobSchedulerError('ExceedJobMaxLimit', 'Mock');
  const jobScheduler = { addBtJob: jest.fn().mockReturnValue(te.left(error)) };
  return setupServer({ jobScheduler });
}
function setupAddBtJobFailed() {
  const error = createJobSchedulerError('AddBtJobFailed', 'Mock');
  const jobScheduler = { addBtJob: jest.fn().mockReturnValue(te.left(error)) };
  return setupServer({ jobScheduler });
}
function setupSuccess() {
  const executionId = randomString();
  const createdAt = randomAnyDate();
  return {
    httpServer: setupServer({
      jobScheduler: { addBtJob: jest.fn().mockReturnValue(te.right({ id: executionId, createdAt })) },
    }),
    executionId,
    createdAt,
  };
}

const { method, url } = BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY;
const setupServer = setupTestServer(method, url, buildExecuteBtStrategyController, mockDeps);

describe('GIVEN the backtesting strategy already exists', () => {
  describe('WHEN user successfully requests to execute the strategy', () => {
    it('THEN it should return HTTP202 and response body with created ID, timestamp, progress path, and result path', async () => {
      const { httpServer, executionId, createdAt } = setupSuccess();

      const resp = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

      expect(resp.statusCode).toBe(202);
      expect(resp.json()).toEqual({
        id: executionId,
        createdAt: createdAt.toJSON(),
        progressPath: expect.toInclude(executionId),
        resultPath: expect.toInclude(executionId),
      });
    });
  });
});

describe('WHEN user sends request with backtesting strategy ID equal to empty string', () => {
  it('THEN it should return HTTP400 and error response body', async () => {
    const { httpServer } = setupSuccess();

    const resp = await httpServer.inject({ method, url: url.replace(':id', '') });

    expect(resp.statusCode).toBe(400);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN the backtesting strategy does not exist', () => {
  it('THEN it should return HTTP404 and error response body', async () => {
    const httpServer = setupNotExist();

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN checking existence of the strategy fails', () => {
  it('THEN it should return HTTP500 and error response body', async () => {
    const httpServer = setupCheckBtStrategyFailed();

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN some pending or running execution already exists', () => {
  it('THEN it should return HTTP409 and error response body', async () => {
    const httpServer = setupPendingOrRunningExist();

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN adding backtesting job fails', () => {
  it('THEN it should return HTTP500 and error response body', async () => {
    const httpServer = setupAddBtJobFailed();

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});
