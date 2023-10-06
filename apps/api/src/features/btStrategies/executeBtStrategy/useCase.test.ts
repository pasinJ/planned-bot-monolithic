import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { createJobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';

import { createBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BtExecutionId } from '../dataModels/btExecution.js';
import { ExecuteBtStrategyDeps, executeBtStrategy } from './useCase.js';

function mockDeps(overrides?: DeepPartial<ExecuteBtStrategyDeps>): ExecuteBtStrategyDeps {
  return mergeDeepRight(
    {
      btStrategyDao: { existById: jest.fn().mockReturnValue(te.right(true)) },
      btJobScheduler: {
        scheduleBtJob: jest
          .fn()
          .mockReturnValue(
            te.right({ btExecutionId: 'l57coyJ4FI' as BtExecutionId, createdAt: new Date('2010-11-04') }),
          ),
      },
    },
    overrides ?? {},
  ) as ExecuteBtStrategyDeps;
}

describe('[GIVEN] the backtesting strategy ID exists', () => {
  describe('[WHEN] execute the existing backtesting strategy', () => {
    let deps: ExecuteBtStrategyDeps;
    const executionId = 'nOuC-8aK_1' as BtExecutionId;
    const createdAt = new Date('2034-10-30') as ValidDate;
    const request = { btStrategyId: 'nv4f6qKmZZ' };

    beforeEach(() => {
      deps = mockDeps({
        btJobScheduler: {
          scheduleBtJob: jest.fn().mockReturnValue(te.right({ id: executionId, createdAt })),
        },
      });
    });

    it('[THEN] it will check if the strategy exists', async () => {
      await pipe(executeBtStrategy(deps, request), executeT);

      expect(deps.btStrategyDao.existById).toHaveBeenCalledExactlyOnceWith(request.btStrategyId);
    });
    it('[THEN] it will schedule a backtesting job', async () => {
      await pipe(executeBtStrategy(deps, request), executeT);

      expect(deps.btJobScheduler.scheduleBtJob).toHaveBeenCalledExactlyOnceWith(request.btStrategyId);
    });
    it('[THEN] it will return Right of execution ID, created timestamp, progressPath, and resultPath', async () => {
      const result = await pipe(executeBtStrategy(deps, request), executeT);

      expect(result).toEqualRight({
        id: executionId,
        createdAt,
        progressPath: expect.toInclude(executionId),
        resultPath: expect.toInclude(executionId),
      });
    });
  });
});

describe('[GIVEN] the backtesting strategy ID does not exist', () => {
  describe('[WHEN] execute backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const deps = mockDeps({ btStrategyDao: { existById: () => te.right(false) } });
      const request = { btStrategyId: 'fIb_Q6besp' };

      const result = await pipe(executeBtStrategy(deps, request), executeT);

      expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
    });
  });
});

describe('[GIVEN] DAO fails to check existence of the strategy', () => {
  describe('[WHEN] execute a backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createBtStrategyDaoError('ExistByIdFailed', 'Mock');
      const deps = mockDeps({ btStrategyDao: { existById: () => te.left(error) } });
      const request = { btStrategyId: 'YHK0b4Wt9q' };

      const result = await pipe(executeBtStrategy(deps, request), executeT);

      expect(result).toEqualLeft(error);
    });
  });
});

describe('[GIVEN] the backtesting strategy is pending or running', () => {
  describe('[WHEN] execute that strategy again', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createJobSchedulerError('ExceedJobMaxSchedulingLimit', 'Mock');
      const deps = mockDeps({ btJobScheduler: { scheduleBtJob: () => te.left(error) } });
      const request = { btStrategyId: 'c0Xm3ej0UD' };

      const result = await pipe(executeBtStrategy(deps, request), executeT);

      expect(result).toEqualLeft(error);
    });
  });
});

describe('[GIVEN] job schduler fails to schedule the backtesting job', () => {
  describe('[WHEN] execute the backtesting strategy', () => {
    it('[THEN] it will return Left of error', async () => {
      const error = createJobSchedulerError('ScheduleJobFailed', 'Mock');
      const deps = mockDeps({ btJobScheduler: { scheduleBtJob: () => te.left(error) } });
      const request = { btStrategyId: 'Al6gonQuDJ' };

      const result = await pipe(executeBtStrategy(deps, request), executeT);

      expect(result).toEqualLeft(error);
    });
  });
});
