import { waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither';
import { generatePath } from 'react-router-dom';

import { BACKTEST_STRATEGY_ROUTE } from '#routes/routes.constant';
import { mockBtStrategy } from '#test-utils/features/btStrategies/btStrategy';
import { renderHookWithContexts } from '#test-utils/render';

import { BtStrategyId } from '../btStrategy';
import { BtStrategyRepo } from '../btStrategy.repository';
import { createBtStrategyRepoError } from '../btStrategy.repository.error';
import useBtStrategy from './useBtStrategy';

function renderUseBtStrategy(
  autoFetchEnabled: boolean,
  btStrategyId: BtStrategyId | undefined,
  overrides: { btStrategyRepo: Partial<BtStrategyRepo> },
  currentPath: string,
) {
  return renderHookWithContexts(
    () => useBtStrategy(autoFetchEnabled, btStrategyId),
    ['Infra', 'ServerState', 'Routes'],
    {
      infraContext: overrides,
      routes: { uiPath: BACKTEST_STRATEGY_ROUTE, currentPath },
    },
  );
}

describe('[GIVEN] the current path does not contain ID', () => {
  describe('[WHEN] use backtesting strategy hook with ID', () => {
    it('[THEN] it will call backtesting strategy repository to get the backtesting strategy with that ID', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getBtStrategyById: jest.fn().mockReturnValue(te.right(mockBtStrategy())),
      };
      const btStrategyId = 'PnU65dncz4' as BtStrategyId;
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);

      renderUseBtStrategy(true, btStrategyId, { btStrategyRepo }, path);

      await waitFor(() =>
        expect(btStrategyRepo.getBtStrategyById).toHaveBeenCalledExactlyOnceWith(btStrategyId),
      );
    });
  });
  describe('[WHEN] use backtesting strategy hook without ID', () => {
    it('[THEN] it will not call backtesting strategy repository', () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getBtStrategyById: jest.fn().mockReturnValue(te.right(mockBtStrategy())),
      };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);

      renderUseBtStrategy(true, undefined, { btStrategyRepo }, path);

      expect(btStrategyRepo.getBtStrategyById).not.toHaveBeenCalled();
    });
  });
});

describe('[GIVEN] the current path contains ID', () => {
  describe('[WHEN] use backtesting strategy hook with ID', () => {
    it('[THEN] it will call backtesting strategy repository to exeute the backtesting strategy with the ID from hook', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getBtStrategyById: jest.fn().mockReturnValue(te.right(mockBtStrategy())),
      };
      const btStrategyId = 'PnU65dncz4' as BtStrategyId;
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { btStrategyId: 'MTSSxIKdS5' });

      renderUseBtStrategy(true, btStrategyId, { btStrategyRepo }, path);

      await waitFor(() =>
        expect(btStrategyRepo.getBtStrategyById).toHaveBeenCalledExactlyOnceWith(btStrategyId),
      );
    });
  });
  describe('[WHEN] use backtesting strategy hook without ID', () => {
    it('[THEN] it will call backtesting strategy repository to exeute the backtesting strategy with the ID from path', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getBtStrategyById: jest.fn().mockReturnValue(te.right(mockBtStrategy())),
      };
      const btStrategyId = 'PnU65dncz4' as BtStrategyId;
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { btStrategyId });

      renderUseBtStrategy(true, undefined, { btStrategyRepo }, path);

      await waitFor(() =>
        expect(btStrategyRepo.getBtStrategyById).toHaveBeenCalledExactlyOnceWith(btStrategyId),
      );
    });
  });
});

describe('[GIVEN] backtesting strategy return Right of a backtesting strategy', () => {
  describe('[WHEN] use backtesting strategy hook', () => {
    it('[THEN] it will return data property equals to the list of backtesting strategies', async () => {
      const btStrategy = mockBtStrategy();
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getBtStrategyById: jest.fn().mockReturnValue(te.right(btStrategy)),
      };
      const btStrategyId = 'PnU65dncz4' as BtStrategyId;
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);

      const { result } = renderUseBtStrategy(true, btStrategyId, { btStrategyRepo }, path);

      await waitFor(() => expect(result.current.data).toEqual(btStrategy));
    });
  });
});

describe('[GIVEN] backtesting strategy repository return Left of error', () => {
  describe('[WHEN] use backtesting strategy hook', () => {
    it('[THEN] it will return error property equals to the error from repository', async () => {
      const error = createBtStrategyRepoError('GetBtStrategyByIdFailed', 'Mock');
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getBtStrategyById: jest.fn().mockReturnValue(te.left(error)),
      };
      const btStrategyId = 'PnU65dncz4' as BtStrategyId;
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);

      const { result } = renderUseBtStrategy(true, btStrategyId, { btStrategyRepo }, path);

      await waitFor(() => expect(result.current.error).toEqual(error));
    });
  });
});
