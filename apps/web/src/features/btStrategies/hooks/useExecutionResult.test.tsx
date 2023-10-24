import { waitFor } from '@testing-library/react';
import * as te from 'fp-ts/lib/TaskEither.js';
import { generatePath } from 'react-router-dom';

import { BACKTEST_STRATEGY_ROUTE } from '#routes/routes.constant';
import { isGeneralError } from '#shared/errors/generalError';
import { renderHookWithContexts } from '#test-utils/render';

import { BtExecutionId, btExecutionStatusEnum } from '../btExecution';
import { BtStrategyRepo, GetExecutionResultResp } from '../btStrategy.repository';
import { createBtStrategyRepoError } from '../btStrategy.repository.error';
import useExecutionResult from './useExecutionResult';

function renderUseExecutionResult(
  btExecutionId: BtExecutionId,
  overrides: { btStrategyRepo: Partial<BtStrategyRepo> },
  currentPath: string,
) {
  return renderHookWithContexts(() => useExecutionResult(btExecutionId), ['Infra', 'ServerState', 'Routes'], {
    infraContext: overrides,
    routes: { uiPath: BACKTEST_STRATEGY_ROUTE, currentPath },
  });
}
const response = {
  status: btExecutionStatusEnum.FINISHED,
  executionTimeMs: 10000,
  logs: ['log1'],
  orders: {
    openingOrders: [],
    submittedOrders: [],
    triggeredOrders: [],
    filledOrders: [],
    canceledOrders: [],
    rejectedOrders: [],
  },
  trades: { openingTrades: [], closedTrades: [] },
  performance: {
    netReturn: 99,
    netProfit: 99,
    netLoss: 99,
    buyAndHoldReturn: 99,
    maxDrawdown: 999,
    maxRunup: 999,
    returnOfInvestment: 99,
    profitFactor: 99,
    totalTradeVolume: 99,
    totalFees: { inCapitalCurrency: 9, inAssetCurrency: 9 },
    backtestDuration: '1 days',
    winLossMetrics: {
      numOfTotalTrades: 19,
      numOfWinningTrades: 19,
      numOfLosingTrades: 19,
      numOfEvenTrades: 19,
      winRate: 9.9,
      lossRate: 9.9,
      evenRate: 9.9,
      avgProfit: 9.9,
      avgLoss: 9.9,
      largestProfit: 9.9,
      largestLoss: 9.9,
    },
  },
} as unknown as GetExecutionResultResp;

describe('[GIVEN] the current path does not contain ID', () => {
  describe('[WHEN] use execution result hook', () => {
    it('[THEN] it will return error', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {};
      const path = generatePath(BACKTEST_STRATEGY_ROUTE);
      const btExecutionId = 'bBJM-qLZyO' as BtExecutionId;

      const { result } = renderUseExecutionResult(btExecutionId, { btStrategyRepo }, path);

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toEqual(expect.toSatisfy(isGeneralError));
    });
  });
});

describe('[GIVEN] the current path contains ID', () => {
  describe('[WHEN] use execution result hook', () => {
    it('[THEN] it will call backtesting repository for getting execution progress', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getExecutionResult: jest.fn().mockReturnValue(te.right(response)),
      };
      const btStrategyId = 'CDjYfJFPml';
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { id: btStrategyId });
      const btExecutionId = 'bBJM-qLZyO' as BtExecutionId;

      renderUseExecutionResult(btExecutionId, { btStrategyRepo }, path);

      await waitFor(() =>
        expect(btStrategyRepo.getExecutionResult).toHaveBeenCalledExactlyOnceWith(
          btStrategyId,
          btExecutionId,
        ),
      );
    });
  });
});

describe('[GIVEN] the repository return Right of response', () => {
  describe('[WHEN] use execution result hook', () => {
    it('[THEN] it will return data property equals to the response', async () => {
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getExecutionResult: jest.fn().mockReturnValue(te.right(response)),
      };
      const btStrategyId = 'CDjYfJFPml';
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { id: btStrategyId });
      const btExecutionId = 'bBJM-qLZyO' as BtExecutionId;

      const { result } = renderUseExecutionResult(btExecutionId, { btStrategyRepo }, path);

      await waitFor(() => expect(result.current.data).toEqual(response));
    });
  });
});

describe('[GIVEN] the repository return Left of error', () => {
  describe('[WHEN] use execution result hook', () => {
    it('[THEN] it will return repository error', async () => {
      const error = createBtStrategyRepoError('GetExecutionResultFailed', 'Mock');
      const btStrategyRepo: Partial<BtStrategyRepo> = {
        getExecutionResult: jest.fn().mockReturnValue(te.left(error)),
      };
      const path = generatePath(BACKTEST_STRATEGY_ROUTE, { id: 'CDjYfJFPml' });
      const btExecutionId = 'bBJM-qLZyO' as BtExecutionId;

      const { result } = renderUseExecutionResult(btExecutionId, { btStrategyRepo }, path);

      await waitFor(() => expect(result.current.error).toEqual(error));
    });
  });
});
