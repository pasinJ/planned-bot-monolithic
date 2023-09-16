import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';

import { createJobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { DeepPartial } from '#shared/helpers.type.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { randomAnyDate, randomString } from '#test-utils/faker.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { ExecuteBtStrategyControllerDeps, buildExecuteBtStrategyController } from './controller.js';

function mockDeps(overrides?: DeepPartial<ExecuteBtStrategyControllerDeps>): ExecuteBtStrategyControllerDeps {
  return mergeDeepRight(
    {
      btStrategyDao: { existById: () => te.right(true) },
      btJobScheduler: {
        scheduleBtJob: () => te.right({ btExecutionId: randomString(), createdAt: randomAnyDate() }),
      },
    },
    overrides ?? {},
  ) as ExecuteBtStrategyControllerDeps;
}

const { method, url } = BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY;
const setupServer = setupTestServer(method, url, buildExecuteBtStrategyController, mockDeps);

describe('GIVEN the backtesting strategy already exists', () => {
  describe('WHEN user successfully requests to execute the strategy', () => {
    it('THEN it should return HTTP202 and response body with created ID, timestamp, progress path, and result path', async () => {
      const executionId = randomString();
      const createdAt = randomAnyDate();
      const httpServer = setupServer({
        btJobScheduler: { scheduleBtJob: () => te.right({ id: executionId, createdAt }) },
      });

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
    const httpServer = setupServer();

    const resp = await httpServer.inject({ method, url: url.replace(':id', '') });

    expect(resp.statusCode).toBe(400);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN the backtesting strategy does not exist', () => {
  it('THEN it should return HTTP404 and error response body', async () => {
    const httpServer = setupServer({ btStrategyDao: { existById: () => te.right(false) } });

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN checking existence of the strategy fails', () => {
  it('THEN it should return HTTP500 and error response body', async () => {
    const error = createBtStrategyDaoError('ExistByIdFailed', 'Mock');
    const httpServer = setupServer({ btStrategyDao: { existById: () => te.left(error) } });

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN some pending or running execution already exists', () => {
  it('THEN it should return HTTP409 and error response body', async () => {
    const error = createJobSchedulerError('ExceedJobMaxSchedulingLimit', 'Mock');
    const httpServer = setupServer({ btJobScheduler: { scheduleBtJob: () => te.left(error) } });

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('WHEN adding backtesting job fails', () => {
  it('THEN it should return HTTP500 and error response body', async () => {
    const error = createJobSchedulerError('ScheduleJobFailed', 'Mock');
    const httpServer = setupServer({ btJobScheduler: { scheduleBtJob: () => te.left(error) } });

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});
