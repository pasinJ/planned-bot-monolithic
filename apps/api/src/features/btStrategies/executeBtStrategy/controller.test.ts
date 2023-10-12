import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { createJobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { ValidDate } from '#shared/utils/date.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BtExecutionId } from '../dataModels/btExecution.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { ExecuteBtStrategyControllerDeps, buildExecuteBtStrategyController } from './controller.js';

function mockDeps(overrides?: DeepPartial<ExecuteBtStrategyControllerDeps>): ExecuteBtStrategyControllerDeps {
  return mergeDeepRight(
    {
      btStrategyDao: { existById: () => te.right(true) },
      btJobScheduler: {
        scheduleBtJob: () =>
          te.right({
            btExecutionId: 'HXaxABKzIQ' as BtExecutionId,
            createdAt: new Date('2020-11-12') as ValidDate,
          }),
      },
    },
    overrides ?? {},
  ) as ExecuteBtStrategyControllerDeps;
}

const { method, url } = BT_STRATEGY_ENDPOINTS.EXECUTE_BT_STRATEGY;
const anyBtStrategyId = 'Z1bNO6xwA2';
const setupServer = setupTestServer(method, url, buildExecuteBtStrategyController, mockDeps);

describe('[GIVEN] request is valid [AND] backtesting strategy ID exists', () => {
  describe('[WHEN] user sends a request to execute the backtesting strategy', () => {
    it('[THEN] it will return HTTP202 and response body with execution ID, timestamp, progress path, and result path', async () => {
      const executeBtUrl = url.replace(':id', anyBtStrategyId);
      const executionId = '8ud6E71NKg' as BtExecutionId;
      const createdAt = new Date('2020-12-12') as ValidDate;
      const httpServer = setupServer({
        btJobScheduler: { scheduleBtJob: () => te.right({ id: executionId, createdAt }) },
      });

      const resp = await httpServer.inject({ method, url: executeBtUrl });

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

describe('[GIVEN] url has backtesting strategy ID param equals to an empty string', () => {
  describe('[WHEN] user sends a request to execute the backtesting strategy', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const httpServer = setupServer();
      const executeBtUrl = url.replace(':id', '');

      const resp = await httpServer.inject({ method, url: executeBtUrl });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] backtesting strategy ID does not exist', () => {
  describe('[WHEN] user sends a request to execute the backtesting strategy', () => {
    it('[THEN] it will return HTTP404 and error response body', async () => {
      const executeBtUrl = url.replace(':id', anyBtStrategyId);
      const httpServer = setupServer({ btStrategyDao: { existById: () => te.right(false) } });

      const response = await httpServer.inject({ method, url: executeBtUrl });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] DAO fails to check existence of that backtesting strategy', () => {
  describe('[WHEN] user sends a request to execute the backtesting strategy', () => {
    it('[THEN] it will return HTTP500 and error response body', async () => {
      const executeBtUrl = url.replace(':id', anyBtStrategyId);
      const error = createBtStrategyDaoError('ExistByIdFailed', 'Mock');
      const httpServer = setupServer({ btStrategyDao: { existById: () => te.left(error) } });

      const response = await httpServer.inject({ method, url: executeBtUrl });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the backtesting strategy is pending or running', () => {
  describe('[WHEN] user sends a request to execute that strategy', () => {
    it('[THEN] it will return HTTP409 and error response body', async () => {
      const executeBtUrl = url.replace(':id', anyBtStrategyId);
      const error = createJobSchedulerError('ExceedJobMaxSchedulingLimit', 'Mock');
      const httpServer = setupServer({ btJobScheduler: { scheduleBtJob: () => te.left(error) } });

      const response = await httpServer.inject({ method, url: executeBtUrl });

      expect(response.statusCode).toBe(409);
      expect(response.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] job scheduler fails to schedule a new backtesting job', () => {
  describe('[WHEN] user sends a request to execute the backtesting strategy', () => {
    it('[THEN] it will return HTTP500 and error response body', async () => {
      const executeBtUrl = url.replace(':id', anyBtStrategyId);
      const error = createJobSchedulerError('ScheduleJobFailed', 'Mock');
      const httpServer = setupServer({ btJobScheduler: { scheduleBtJob: () => te.left(error) } });

      const response = await httpServer.inject({ method, url: executeBtUrl });

      expect(response.statusCode).toBe(500);
      expect(response.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});
