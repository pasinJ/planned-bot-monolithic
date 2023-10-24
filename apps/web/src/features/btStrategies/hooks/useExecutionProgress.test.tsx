import { waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither.js';
import { generatePath } from 'react-router-dom';

import { BACKTEST_STRATEGY_ROUTE } from '#routes/routes.constant';
import { isGeneralError } from '#shared/errors/generalError';
import { renderHookWithContexts } from '#test-utils/render';

import { BtExecutionId, btExecutionStatusEnum } from '../btExecution';
import { BtStrategyRepo } from '../btStrategy.repository';
import { createBtStrategyRepoError } from '../btStrategy.repository.error';
import useExecutionProgress from './useExecutionProgress';

function renderUseExecutionProgress(
  btExecutionId: BtExecutionId,
  overrides: { btStrategyRepo: Partial<BtStrategyRepo> },
  currentPath: string,
) {
  return renderHookWithContexts(
    () => useExecutionProgress(btExecutionId),
    ['Infra', 'ServerState', 'Routes'],
    {
      infraContext: overrides,
      routes: { uiPath: BACKTEST_STRATEGY_ROUTE, currentPath },
    },
  );
}

describe('[GIVEN] the current path does not contain ID', () => {
  describe('[WHEN] use execution progress hook', () => {
    it('[THEN] it will return error', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {};
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);
      const btExecutionId = 'bBJM-qLZyO' as BtExecutionId;

      const { result } = renderUseExecutionProgress(btExecutionId, { btStrategyRepo }, path);

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(expect.toSatisfy(isGeneralError));
    });
  });
});

describe('[GIVEN] the current path contains ID', () => {
  describe('[WHEN] use execution progress hook', () => {
    it('[THEN] it will call backtesting repository for getting execution progress', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getExecutionProgress: jest
          .fn()
          .mockReturnValue(te.right({ status: btExecutionStatusEnum.PENDING, progress: 0, logs: [] })),
      };
      const btStrategyId = 'CDjYfJFPml';
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { id: btStrategyId });
      const btExecutionId = 'bBJM-qLZyO' as BtExecutionId;

      renderUseExecutionProgress(btExecutionId, { btStrategyRepo }, path);

      await waitFor(() =>
        expect(btStrategyRepo.getExecutionProgress).toHaveBeenCalledExactlyOnceWith(
          btStrategyId,
          btExecutionId,
        ),
      );
    });
  });
});

describe('[GIVEN] the repository return Right of status, progress percentage, and logs', () => {
  describe('[WHEN] use execution progress hook', () => {
    it('[THEN] it will return data property equals to status, progress percentage, and logs', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getExecutionProgress: jest
          .fn()
          .mockReturnValue(te.right({ status: btExecutionStatusEnum.PENDING, progress: 0, logs: [] })),
      };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { id: 'CDjYfJFPml' });
      const btExecutionId = 'bBJM-qLZyO' as BtExecutionId;

      const { result } = renderUseExecutionProgress(btExecutionId, { btStrategyRepo }, path);

      await waitFor(() =>
        expect(result.current.data).toEqual({ status: btExecutionStatusEnum.PENDING, progress: 0, logs: [] }),
      );
    });
  });
});

describe('[GIVEN] the repository return Left of error', () => {
  describe('[WHEN] use execution progress hook', () => {
    it('[THEN] it will return repository error', async () => {
      const error = createBtStrategyRepoError('GetExecutionProgressFailed', 'Mock');
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getExecutionProgress: jest.fn().mockReturnValue(te.left(error)),
      };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { id: 'CDjYfJFPml' });
      const btExecutionId = 'bBJM-qLZyO' as BtExecutionId;

      const { result } = renderUseExecutionProgress(btExecutionId, { btStrategyRepo }, path);

      await waitFor(() => expect(result.current.error).toEqual(error));
    });
  });
});

describe('[GIVEN] the returned progress is not final', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  describe('[WHEN] use execution progress hook', () => {
    it('[THEN] it will keep calling repository until the progress is final', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getExecutionProgress: jest
          .fn()
          .mockReturnValueOnce(te.right({ status: btExecutionStatusEnum.PENDING, percentage: 0, logs: [] }))
          .mockReturnValueOnce(te.right({ status: btExecutionStatusEnum.RUNNING, percentage: 50, logs: [] }))
          .mockReturnValueOnce(
            te.right({ status: btExecutionStatusEnum.FINISHED, percentage: 100, logs: [] }),
          ),
      };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { id: 'CDjYfJFPml' });
      const btExecutionId = 'bBJM-qLZyO' as BtExecutionId;

      renderUseExecutionProgress(btExecutionId, { btStrategyRepo }, path);

      await jest.advanceTimersByTimeAsync(10000);

      await waitFor(() => expect(btStrategyRepo.getExecutionProgress).toHaveBeenCalledTimes(3));
    });
  });
});
