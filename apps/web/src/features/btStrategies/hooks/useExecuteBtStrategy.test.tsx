import { act, waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { generatePath } from 'react-router-dom';

import { BACKTEST_STRATEGY_ROUTE } from '#routes/routes.constant';
import { isGeneralError } from '#shared/errors/generalError';
import { renderHookWithContexts } from '#test-utils/render';

import { BtStrategyId } from '../btStrategy';
import { BtStrategyRepo } from '../btStrategy.repository';
import { createBtStrategyRepoError } from '../btStrategy.repository.error';
import useExecuteBtStrategy from './useExecuteBtStrategy';

function renderUseExecuteBtStrategy(
  overrides: { btStrategyRepo: Partial<BtStrategyRepo> },
  currentPath: string,
) {
  return renderHookWithContexts(() => useExecuteBtStrategy(), ['Infra', 'ServerState', 'Routes'], {
    infraContext: overrides,
    routes: { uiPath: BACKTEST_STRATEGY_ROUTE, currentPath },
  });
}

describe('[GIVEN] the current path does not contain ID', () => {
  describe('[WHEN] use execute backtesting strategy hook with ID', () => {
    it('[THEN] it will call backtesting strategy repository to exeute the backtesting strategy with that ID', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        executeBtStrategy: jest
          .fn()
          .mockReturnValue(te.right({ id: 'id', createdAt: new Date('2022-01-01') })),
      };
      const btStrategyId = 'PnU65dncz4' as BtStrategyId;
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);
      const { result } = renderUseExecuteBtStrategy({ btStrategyRepo }, path);

      act(() => result.current.mutate(btStrategyId));

      await waitFor(() =>
        expect(btStrategyRepo.executeBtStrategy).toHaveBeenCalledExactlyOnceWith(btStrategyId),
      );
    });
  });
  describe('[WHEN] use execute backtesting strategy hook without ID', () => {
    it('[THEN] it will return error', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        executeBtStrategy: jest
          .fn()
          .mockReturnValue(te.right({ id: 'id', createdAt: new Date('2022-01-01') })),
      };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);
      const { result } = renderUseExecuteBtStrategy({ btStrategyRepo }, path);

      act(() => result.current.mutate(undefined));

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(expect.toSatisfy(isGeneralError));
    });
  });
});

describe('[GIVEN] the current path contains ID', () => {
  describe('[WHEN] use execute backtesting strategy hook with ID', () => {
    it('[THEN] it will call backtesting strategy repository to exeute the backtesting strategy with the ID from hook', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        executeBtStrategy: jest
          .fn()
          .mockReturnValue(te.right({ id: 'id', createdAt: new Date('2022-01-01') })),
      };
      const btStrategyId = 'lHZZrO41LX' as BtStrategyId;
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { btStrategyId: 'UgNkxeEZm4' });
      const { result } = renderUseExecuteBtStrategy({ btStrategyRepo }, path);

      act(() => result.current.mutate(btStrategyId));

      await waitFor(() =>
        expect(btStrategyRepo.executeBtStrategy).toHaveBeenCalledExactlyOnceWith(btStrategyId),
      );
    });
  });
  describe('[WHEN] use execute backtesting strategy hook without ID', () => {
    it('[THEN] it will call backtesting strategy repository to exeute the backtesting strategy with the ID from path', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        executeBtStrategy: jest
          .fn()
          .mockReturnValue(te.right({ id: 'id', createdAt: new Date('2022-01-01') })),
      };
      const btStrategyId = 'UgNkxeEZm4';
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { btStrategyId });
      const { result } = renderUseExecuteBtStrategy({ btStrategyRepo }, path);

      act(() => result.current.mutate(undefined));

      await waitFor(() =>
        expect(btStrategyRepo.executeBtStrategy).toHaveBeenCalledExactlyOnceWith(btStrategyId),
      );
    });
  });
});

describe('[GIVEN] backtesting strategy repository return Right of execution ID and creation timestamp', () => {
  describe('[WHEN] use execute backtesting strategy hook', () => {
    it('[THEN] it will return data property equals to the execution ID and creation timestamp', async () => {
      const btExecutionId = 'CCkngT_sY5';
      const creationTimestamp = new Date('2022-01-01');
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        executeBtStrategy: jest
          .fn()
          .mockReturnValue(te.right({ id: btExecutionId, createdAt: creationTimestamp })),
      };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { btStrategyId: 'UgNkxeEZm4' });
      const { result } = renderUseExecuteBtStrategy({ btStrategyRepo }, path);

      act(() => result.current.mutate(undefined));

      await waitFor(() =>
        expect(result.current.data).toEqual({ id: btExecutionId, createdAt: creationTimestamp }),
      );
    });
  });
});

describe('[GIVEN] backtesting strategy repository return Left of error', () => {
  describe('[WHEN] use execute backtesting strategy hook', () => {
    it('[THEN] it will return error from the repository', async () => {
      const error = createBtStrategyRepoError('ExecuteBtStrategyFailed', 'Mock');
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        executeBtStrategy: jest.fn().mockReturnValue(te.left(error)),
      };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { btStrategyId: 'UgNkxeEZm4' });
      const { result } = renderUseExecuteBtStrategy({ btStrategyRepo }, path);

      act(() => result.current.mutate(undefined));

      await waitFor(() => expect(result.current.error).toEqual(error));
    });
  });
});
