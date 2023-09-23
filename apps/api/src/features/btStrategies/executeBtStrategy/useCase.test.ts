import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { createJobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { executeT } from '#shared/utils/fp.js';
import { randomDate } from '#test-utils/faker/date.js';
import { randomString } from '#test-utils/faker/string.js';
import { randomBtExecutionId } from '#test-utils/features/btStrategies/models.js';

import { createBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { ExecuteBtStrategyDeps, ExecuteBtStrategyRequest, executeBtStrategy } from './useCase.js';

function mockDeps(overrides?: DeepPartial<ExecuteBtStrategyDeps>): ExecuteBtStrategyDeps {
  return mergeDeepRight(
    {
      btStrategyDao: { existById: jest.fn().mockReturnValue(te.right(true)) },
      btJobScheduler: {
        scheduleBtJob: jest
          .fn()
          .mockReturnValue(te.right({ btExecutionId: randomString(), createdAt: randomDate() })),
      },
    },
    overrides ?? {},
  ) as ExecuteBtStrategyDeps;
}
function createRequest(): ExecuteBtStrategyRequest {
  return { btStrategyId: randomString() };
}

describe('[WHEN] execute an existing backtesting strategy', () => {
  it('[THEN] it will check if the strategy exists', async () => {
    const deps = mockDeps();
    const request = createRequest();

    await pipe(executeBtStrategy(deps, request), executeT);

    expect(deps.btStrategyDao.existById).toHaveBeenCalledExactlyOnceWith(request.btStrategyId);
  });
  it('[THEN] it will schedule a backtesting job', async () => {
    const deps = mockDeps();
    const request = createRequest();

    await pipe(executeBtStrategy(deps, request), executeT);

    expect(deps.btJobScheduler.scheduleBtJob).toHaveBeenCalledExactlyOnceWith(request.btStrategyId);
  });
  it('[THEN] it will return Right of execution ID, created timestamp, progressPath, and resultPath', async () => {
    const executionId = randomBtExecutionId();
    const createdAt = randomDate();
    const deps = mockDeps({
      btJobScheduler: { scheduleBtJob: () => te.right({ id: executionId, createdAt }) },
    });

    const result = await pipe(executeBtStrategy(deps, createRequest()), executeT);

    expect(result).toEqualRight({
      id: executionId,
      createdAt,
      progressPath: expect.toInclude(executionId),
      resultPath: expect.toInclude(executionId),
    });
  });
});

describe('[WHEN] execute a not existing backtesting strategy', () => {
  it('[THEN] it will return Left of error', async () => {
    const deps = mockDeps({ btStrategyDao: { existById: () => te.right(false) } });

    const result = await pipe(executeBtStrategy(deps, createRequest()), executeT);

    expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
  });
});

describe('[WHEN] execute a backtesting strategy [BUT] DAO fails to check existence of the strategy', () => {
  it('[THEN] it will return Left of error', async () => {
    const error = createBtStrategyDaoError('ExistByIdFailed', 'Mock');
    const deps = mockDeps({ btStrategyDao: { existById: () => te.left(error) } });

    const result = await pipe(executeBtStrategy(deps, createRequest()), executeT);

    expect(result).toEqualLeft(error);
  });
});

describe('[GIVEN] a backtesting strategy is pending or running', () => {
  describe('[WHEN] execute that strategy again', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createJobSchedulerError('ExceedJobMaxSchedulingLimit', 'Mock');
      const deps = mockDeps({ btJobScheduler: { scheduleBtJob: () => te.left(error) } });

      const result = await pipe(executeBtStrategy(deps, createRequest()), executeT);

      expect(result).toEqualLeft(error);
    });
  });
});

describe('[WHEN] execute an existing backtesting strategy [BUT] job schduler fails to schedule a backtesting job', () => {
  it('[THEN] it will return Left of error', async () => {
    const error = createJobSchedulerError('ScheduleJobFailed', 'Mock');
    const deps = mockDeps({ btJobScheduler: { scheduleBtJob: () => te.left(error) } });

    const result = await pipe(executeBtStrategy(deps, createRequest()), executeT);

    expect(result).toEqualLeft(error);
  });
});
