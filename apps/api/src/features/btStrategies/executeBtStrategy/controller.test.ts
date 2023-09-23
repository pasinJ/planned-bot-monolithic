import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { createJobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { randomDate } from '#test-utils/faker/date.js';
import { randomString } from '#test-utils/faker/string.js';
import { randomBtExecutionId } from '#test-utils/features/btStrategies/models.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { ExecuteBtStrategyControllerDeps, buildExecuteBtStrategyController } from './controller.js';

function mockDeps(overrides?: DeepPartial<ExecuteBtStrategyControllerDeps>): ExecuteBtStrategyControllerDeps {
  return mergeDeepRight(
    {
      btStrategyDao: { existById: () => te.right(true) },
      btJobScheduler: {
        scheduleBtJob: () => te.right({ btExecutionId: randomString(), createdAt: randomDate() }),
      },
    },
    overrides ?? {},
  ) as ExecuteBtStrategyControllerDeps;
}

const { method, url } = BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY;
const setupServer = setupTestServer(method, url, buildExecuteBtStrategyController, mockDeps);

describe('[WHEN] user sends a valid request to execute an existing backtesting strategy', () => {
  it('[THEN] it will return HTTP202 and response body with execution ID, timestamp, progress path, and result path', async () => {
    const executionId = randomBtExecutionId();
    const createdAt = randomDate();
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

describe('[WHEN] user sends an invalid request with backtesting strategy ID param equals to empty string', () => {
  it('[THEN] it will return HTTP400 and error response body', async () => {
    const httpServer = setupServer();

    const resp = await httpServer.inject({ method, url: url.replace(':id', '') });

    expect(resp.statusCode).toBe(400);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('[WHEN] user sends a request to execute not existing backtesting strategy', () => {
  it('[THEN] it will return HTTP404 and error response body', async () => {
    const httpServer = setupServer({ btStrategyDao: { existById: () => te.right(false) } });

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('[WHEN] user sends a valid request to execute a backtesting strategy [BUT] DAO fails to check existence of that backtesting strategy', () => {
  it('[THEN] it will return HTTP500 and error response body', async () => {
    const error = createBtStrategyDaoError('ExistByIdFailed', 'Mock');
    const httpServer = setupServer({ btStrategyDao: { existById: () => te.left(error) } });

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});

describe('[GIVEN] a backtesting strategy is pending or running', () => {
  describe('[WHEN] user sends a valid request to execute that strategy', () => {
    it('[THEN] it will return HTTP409 and error response body', async () => {
      const error = createJobSchedulerError('ExceedJobMaxSchedulingLimit', 'Mock');
      const httpServer = setupServer({ btJobScheduler: { scheduleBtJob: () => te.left(error) } });

      const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[WHEN] user sends a valid request to execute a backtesting strategy [BUT] job scheduler fails to schedule a new backtesting job', () => {
  it('[THEN] it will return HTTP500 and error response body', async () => {
    const error = createJobSchedulerError('ScheduleJobFailed', 'Mock');
    const httpServer = setupServer({ btJobScheduler: { scheduleBtJob: () => te.left(error) } });

    const response = await httpServer.inject({ method, url: url.replace(':id', randomString()) });

    expect(response.statusCode).toBe(500);
    expect(response.json()).toEqual(toBeHttpErrorResponse);
  });
});
