import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { generateOrderId } from '#features/shared/order.js';
import { generateTradeId } from '#features/shared/trade.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { Milliseconds } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { mockBtStrategyModel } from '#test-utils/features/btStrategies/btStrategy.js';
import { mockKline } from '#test-utils/features/shared/kline.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategyModule.js';

import { createBtExecutionDaoError, isBtExecutionDaoError } from '../DAOs/btExecution.error.js';
import { BtExecutionId, btExecutionStatusEnum } from '../dataModels/btExecution.js';
import { BtStrategyId } from '../dataModels/btStrategy.js';
import { GetBtExecutionResultDeps, getBtExecutionResult } from './useCase.js';

function mockDeps(override?: DeepPartial<GetBtExecutionResultDeps>): GetBtExecutionResultDeps {
  const executionResult = {
    id: 'dE9BfrA7u_' as BtExecutionId,
    btStrategyId: 'pa1A4gBBDG' as BtStrategyId,
    status: btExecutionStatusEnum.FAILED,
    logs: ['log1', 'log2'],
    executionTimeMs: 10 as Milliseconds,
    error: createGeneralError('Error', 'Mock').toJSON(),
  };

  return mergeDeepRight<GetBtExecutionResultDeps, DeepPartial<GetBtExecutionResultDeps>>(
    {
      btExecutionDao: { getResultById: () => te.right(executionResult) },
      btStrategyDao: { getById: () => te.right(mockBtStrategyModel()) },
      klineDao: { getLastBefore: () => te.right(mockKline()) },
      generateOrderId,
      generateTradeId,
    },
    override ?? {},
  );
}

describe('UUT: Get backtesting execution result use case', () => {
  describe('[GIVEN] execution ID does not exist', () => {
    describe('[WHEN] get backtesting execution result', () => {
      it('[THEN] it will return Left of error', async () => {
        const error = createBtExecutionDaoError('NotExist', 'Mock');
        const deps = mockDeps({ btExecutionDao: { getResultById: () => te.left(error) } });
        const executionId = 'Mh8NOg55Ns';

        const result = await executeT(getBtExecutionResult(deps, executionId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtExecutionDaoError));
      });
    });
  });

  describe('[GIVEN] DAO fails to get result by ID', () => {
    describe('[WHEN] get backtesting execution result', () => {
      it('[THEN] it will return Left of error', async () => {
        const error = createBtExecutionDaoError('GetResultByIdFailed', 'Mock');
        const deps = mockDeps({ btExecutionDao: { getResultById: () => te.left(error) } });
        const executionId = 'Mh8NOg55Ns';

        const result = await executeT(getBtExecutionResult(deps, executionId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtExecutionDaoError));
      });
    });
  });

  describe('[GIVEN] execution has PENDING or RUNNING status', () => {
    describe('[WHEN] get backtesting execution result', () => {
      it('[THEN] it will return Left of error', async () => {
        const error = createBtExecutionDaoError('InvalidStatus', 'Mock');
        const deps = mockDeps({ btExecutionDao: { getResultById: () => te.left(error) } });
        const executionId = 'Mh8NOg55Ns';

        const result = await executeT(getBtExecutionResult(deps, executionId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtExecutionDaoError));
      });
    });
  });

  describe('[GIVEN] execution has FAILED status', () => {
    describe('[WHEN] get backtesting execution result', () => {
      it('[THEN] it will return Right of execution result', async () => {
        const executionId = 'Mh8NOg55Ns' as BtExecutionId;
        const executionResult = {
          id: executionId,
          btStrategyId: 'rLfO5PIhjQ' as BtStrategyId,
          status: btExecutionStatusEnum.FAILED,
          logs: ['log1'],
          executionTimeMs: 10 as Milliseconds,
          error: createGeneralError('Error', 'Mock').toJSON(),
        };
        const deps = mockDeps({ btExecutionDao: { getResultById: () => te.right(executionResult) } });

        const result = await executeT(getBtExecutionResult(deps, executionId));

        expect(result).toEqualRight(executionResult);
      });
    });
  });

  describe('[GIVEN] execution has FINISHED status', () => {
    const executionId = 'gOOqRCdp3r' as BtExecutionId;
    const btStrategyId = 'xNBjgHEalN' as BtStrategyId;
    const logs = ['log1'];
    const executionTimeMs = 10 as Milliseconds;
    const strategyModule = mockStrategyModule({
      netReturn: 0,
      netProfit: 0,
      netLoss: 0,
      maxDrawdown: 4,
      maxRunup: 5,
      totalFees: { inCapitalCurrency: 6, inAssetCurrency: 7 },
    });
    const orders = {
      openingOrders: [],
      submittedOrders: [],
      triggeredOrders: [],
      filledOrders: [],
      canceledOrders: [],
      rejectedOrders: [],
    };
    const trades = { openingTrades: [], closedTrades: [] };
    const executionResult = {
      id: executionId,
      btStrategyId,
      status: btExecutionStatusEnum.FINISHED,
      logs,
      executionTimeMs,
      strategyModule,
      orders,
      trades,
    };

    const btStrategy = mockBtStrategyModel({
      startTimestamp: new Date('2011-12-12'),
      endTimestamp: new Date('2011-12-13'),
    });

    const deps = mockDeps({
      btExecutionDao: { getResultById: () => te.right(executionResult) },
      btStrategyDao: { getById: jest.fn().mockReturnValue(te.right(btStrategy)) },
      klineDao: { getLastBefore: jest.fn().mockReturnValue(te.right(mockKline())) },
    });

    beforeEach(() => jest.clearAllMocks());

    describe('[WHEN] get backtesting execution result', () => {
      it('[THEN] it will get backtesting strategy by ID', async () => {
        await executeT(getBtExecutionResult(deps, executionId));

        expect(deps.btStrategyDao.getById).toHaveBeenCalledExactlyOnceWith(btStrategyId);
      });
      it('[THEN] it will get last kline before the end of backtesting', async () => {
        await executeT(getBtExecutionResult(deps, executionId));

        const filter = {
          exchange: btStrategy.exchange,
          symbol: btStrategy.symbol,
          timeframe: btStrategy.timeframe,
          start: btStrategy.endTimestamp,
        };
        expect(deps.klineDao.getLastBefore).toHaveBeenCalledExactlyOnceWith(filter);
      });
      it('[THEN] it will return Right of execution result with performance stats', async () => {
        const result = await executeT(getBtExecutionResult(deps, executionId));

        expect(result).toEqualRight({
          id: executionId,
          btStrategyId,
          status: btExecutionStatusEnum.FINISHED,
          logs,
          executionTimeMs,
          orders,
          trades,
          performance: {
            netReturn: 0,
            netProfit: 0,
            netLoss: 0,
            maxDrawdown: 4,
            maxRunup: 5,
            returnOfInvestment: 0,
            profitFactor: 0,
            totalTradeVolume: 0,
            totalFees: { inCapitalCurrency: 6, inAssetCurrency: 7 },
            backtestDuration: '1 day',
            winLossMetrics: {
              avgLoss: 0,
              avgProfit: 0,
              evenRate: 0,
              largestLoss: 0,
              largestProfit: 0,
              lossRate: 0,
              numOfEvenTrades: 0,
              numOfLosingTrades: 0,
              numOfTotalTrades: 0,
              numOfWinningTrades: 0,
              winRate: 0,
            },
          },
        });
      });
    });
  });
});
