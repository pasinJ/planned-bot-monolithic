import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { isNotNil, omit, pick, propEq } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { Kline } from '#features/shared/kline.js';
import {
  DurationString,
  createDateRange,
  getDurationString,
} from '#features/shared/objectValues/dateRange.js';
import { FeeAmount, FilledOrder, OrderId } from '#features/shared/order.js';
import { OrdersLists, TradesLists } from '#features/shared/strategyExecutor/executeStrategy.js';
import {
  EquityDrawdown,
  EquityRunup,
  Loss,
  Profit,
  Return,
  StrategyModule,
} from '#features/shared/strategyExecutorContext/strategy.js';
import {
  BuyAndHoldReturn,
  ProfitFactor,
  ReturnOfInvestment,
  TotalTradeVolume,
  WinLossMetrics,
  calculateBuyAndHoldReturn,
  calculateProfitFactor,
  calculateReturnOfInvestment,
  calculateWinLossMetrics,
  getTotalTradeVolume,
} from '#features/shared/strategyPerformance.js';
import { TradeId } from '#features/shared/trade.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { Milliseconds } from '#shared/utils/date.js';
import { unsafeUnwrapEitherRight } from '#shared/utils/fp.js';

import { GetLastKlineBefore, GetLastKlineBeforeError } from '../../klines/DAOs/kline.feature.js';
import { GetBtExecutionResultById, GetBtExecutionResultByIdError } from '../DAOs/btExecution.feature.js';
import { GetBtStrategyById, GetBtStrategyByIdError } from '../DAOs/btStrategy.feature.js';
import {
  BtExecutionFailedResult,
  BtExecutionId,
  BtExecutionSuccessfulResult,
} from '../dataModels/btExecution.js';
import { BtStrategyId, BtStrategyModel } from '../dataModels/btStrategy.js';
import { ForceExitOpeningTradesError, forceExitOpeningTrades } from './forceExitOpeningTrades.js';

export type GetBtExecutionResultDeps = DeepReadonly<{
  generateOrderId: io.IO<OrderId>;
  generateTradeId: io.IO<TradeId>;
  btExecutionDao: { getResultById: GetBtExecutionResultById };
  btStrategyDao: { getById: GetBtStrategyById };
  klineDao: { getLastBefore: GetLastKlineBefore };
}>;
export type GetBtExecutionResultError =
  | GetBtExecutionResultByIdError
  | GetBtStrategyByIdError
  | GetLastKlineBeforeError
  | GeneralError<'LastKlineNotExist'>
  | ForceExitOpeningTradesError;

export type GetBtExecutionResultResp =
  | BtExecutionFailedResult
  | DeepReadonly<{
      id: BtExecutionId;
      btStrategyId: BtStrategyId;
      status: 'FINISHED';
      executionTimeMs: Milliseconds;
      logs: string[];
      orders: OrdersLists;
      trades: TradesLists;
      performance: {
        netReturn: Return;
        netProfit: Profit;
        netLoss: Loss;
        buyAndHoldReturn: BuyAndHoldReturn;
        maxDrawdown: EquityDrawdown;
        maxRunup: EquityRunup;
        returnOfInvestment: ReturnOfInvestment;
        profitFactor: ProfitFactor;
        totalTradeVolume: TotalTradeVolume;
        totalFees: { inCapitalCurrency: FeeAmount; inAssetCurrency: FeeAmount };
        backtestDuration: DurationString;
        winLossMetrics: WinLossMetrics;
      };
    }>;

export function getBtExecutionResult(
  deps: GetBtExecutionResultDeps,
  executionId: string,
): te.TaskEither<GetBtExecutionResultError, GetBtExecutionResultResp> {
  const { btExecutionDao, btStrategyDao, klineDao } = deps;

  const forceExitDeps = pick(['generateOrderId', 'generateTradeId'], deps);

  return pipe(
    btExecutionDao.getResultById(executionId),
    te.chainW(
      (executionResult): te.TaskEither<GetBtExecutionResultError, GetBtExecutionResultResp> =>
        executionResult.status !== 'FINISHED'
          ? te.right(executionResult)
          : pipe(
              te.Do,
              te.bindW('btStrategy', () => btStrategyDao.getById(executionResult.btStrategyId)),
              te.bindW('lastKline', ({ btStrategy }) =>
                getLastKlineBeforeEndOfBacktest(klineDao, btStrategy),
              ),
              te.bindW('updatedResult', ({ lastKline }) =>
                _forceExitOpeningTrades(forceExitDeps, executionResult, lastKline),
              ),
              te.let('performance', ({ btStrategy, lastKline, updatedResult }) =>
                createPerformanceReport(btStrategy, lastKline, updatedResult),
              ),
              te.map(({ updatedResult, performance }) => ({
                ...omit(['strategyModule', 'orders', 'trades'], executionResult),
                ...omit(['strategyModule'], updatedResult),
                performance,
              })),
            ),
    ),
  );
}

function getLastKlineBeforeEndOfBacktest(
  klineDao: { getLastBefore: GetLastKlineBefore },
  btStrategy: BtStrategyModel,
) {
  return pipe(
    klineDao.getLastBefore({
      exchange: btStrategy.exchange,
      symbol: btStrategy.symbol,
      timeframe: btStrategy.timeframe,
      start: btStrategy.endTimestamp,
    }),
    te.chainW(
      te.fromPredicate(isNotNil, () =>
        createGeneralError(
          'LastKlineNotExist',
          `The last kline of ${
            btStrategy.symbol
          } before ${btStrategy.endTimestamp.toISOString()} doesn't exist`,
        ),
      ),
    ),
  );
}

function _forceExitOpeningTrades(
  deps: { generateOrderId: io.IO<OrderId>; generateTradeId: io.IO<TradeId> },
  executionResult: BtExecutionSuccessfulResult,
  lastKline: Kline,
) {
  return te.fromIOEither(
    forceExitOpeningTrades(
      deps,
      executionResult.strategyModule,
      executionResult.orders,
      executionResult.trades,
      lastKline,
    ),
  );
}

function createPerformanceReport(
  btStrategy: BtStrategyModel,
  lastKline: Kline,
  request: { strategyModule: StrategyModule; orders: OrdersLists; trades: TradesLists },
) {
  const { endTimestamp, startTimestamp } = btStrategy;
  const { strategyModule, orders, trades } = request;
  const { initialCapital, netReturn, netProfit, netLoss, maxDrawdown, maxRunup, totalFees } = strategyModule;
  const { filledOrders } = orders;
  const { closedTrades } = trades;

  type FilledEntryOrder = Extract<FilledOrder, { orderSide: 'ENTRY' }>;
  const firstEntryOrder = orders.filledOrders.find(propEq('ENTRY', 'orderSide')) as FilledEntryOrder;

  const backtestRange = unsafeUnwrapEitherRight(createDateRange(startTimestamp, endTimestamp));

  return {
    netReturn,
    netProfit,
    netLoss,
    buyAndHoldReturn: calculateBuyAndHoldReturn(initialCapital, firstEntryOrder, lastKline),
    maxDrawdown: maxDrawdown,
    maxRunup: maxRunup,
    returnOfInvestment: calculateReturnOfInvestment(initialCapital, netReturn),
    profitFactor: calculateProfitFactor(netProfit, netLoss),
    totalTradeVolume: getTotalTradeVolume(filledOrders),
    totalFees: totalFees,
    backtestDuration: getDurationString(backtestRange),
    winLossMetrics: calculateWinLossMetrics(closedTrades),
  };
}
