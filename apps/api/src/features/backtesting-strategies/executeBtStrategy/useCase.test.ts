import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { createJobSchedulerError } from '#infra/services/jobScheduler/service.error.js';
import { isBusinessError } from '#shared/errors/businessError.js';
import { executeT } from '#shared/utils/fp.js';
import { randomAnyDate, randomString } from '#test-utils/faker.js';

import { createBtStrategyModelDaoError } from '../data-models/btStrategy.dao.error.js';
import { ExecuteBtStrategyDeps, ExecuteBtStrategyRequest, executeBtStrategy } from './useCase.js';

function mockDeps(overrides?: Partial<ExecuteBtStrategyDeps>): ExecuteBtStrategyDeps {
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
function mockRequest(): ExecuteBtStrategyRequest {
  return { btStrategyId: randomString() };
}

describe('WHEN user requests to execute a backtesting strategy', () => {
  it('THEN it should check if the strategy exists', async () => {
    const deps = mockDeps();
    const request = mockRequest();
    await pipe(executeBtStrategy(deps, request), executeT);

    expect(deps.btStrategyModelDao.existById).toHaveBeenCalledExactlyOnceWith(request.btStrategyId);
  });
});

describe('WHEN the backtesting strategy ID does not exist', () => {
  it('THEN it should return Left of error', async () => {
    const deps = mockDeps({ btStrategyModelDao: { existById: jest.fn().mockReturnValue(te.right(false)) } });
    const result = await pipe(executeBtStrategy(deps, mockRequest()), executeT);

    expect(result).toEqualLeft(expect.toSatisfy(isBusinessError));
  });
});

describe('WHEN checking existence of the strategy fails', () => {
  it('THEN it should return Left of error', async () => {
    const error = createBtStrategyModelDaoError('ExistByIdFailed', 'Mock');
    const deps = mockDeps({ btStrategyModelDao: { existById: jest.fn().mockReturnValue(te.left(error)) } });
    const result = await pipe(executeBtStrategy(deps, mockRequest()), executeT);

    expect(result).toEqualLeft(error);
  });
});

describe('WHEN checking existence of the strategy succeeds', () => {
  it('THEN it should schedule backtesting job', async () => {
    const deps = mockDeps();
    const request = mockRequest();
    await pipe(executeBtStrategy(deps, request), executeT);

    expect(deps.jobScheduler.addBtJob).toHaveBeenCalledExactlyOnceWith(request.btStrategyId);
  });

  describe('WHEN adding a backtesting job fails', () => {
    it('THEN it should return Left of error', async () => {
      const error = createJobSchedulerError('AddBtJobFailed', 'Mock');
      const deps = mockDeps({
        jobScheduler: { addBtJob: jest.fn().mockReturnValue(te.left(error)) },
      });
      const result = await pipe(executeBtStrategy(deps, mockRequest()), executeT);

      expect(result).toEqualLeft(error);
    });
  });

  describe('WHEN scheduling a backtesting job succeeds', () => {
    it('THEN it should return Right of execution ID, created timestamp, progressPath, and resultPath', async () => {
      const executionId = randomString();
      const createdAt = randomAnyDate();
      const deps = mockDeps({
        jobScheduler: { addBtJob: jest.fn().mockReturnValue(te.right({ id: executionId, createdAt })) },
      });
      const result = await pipe(executeBtStrategy(deps, mockRequest()), executeT);

      expect(result).toEqualRight({
        id: executionId,
        createdAt,
        progressPath: expect.toInclude(executionId),
        resultPath: expect.toInclude(executionId),
      });
    });
  });
});
