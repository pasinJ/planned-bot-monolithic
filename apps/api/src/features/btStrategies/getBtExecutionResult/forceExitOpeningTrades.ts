import { Decimal } from 'decimal.js';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, concat } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { Kline } from '#features/shared/kline.js';
import { OrderId, OrderQuantity, createFilledOrder } from '#features/shared/order.js';
import { OrdersLists, TradesLists } from '#features/shared/strategyExecutor/executeStrategy.js';
import {
  StrategyModule,
  calculateTotalFeesFromFilledOrders,
  updateStrategyModuleStats,
} from '#features/shared/strategyExecutorModules/strategy.js';
import { TradeId, closeTrades } from '#features/shared/trade.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';

export type ForceExitOpeningTradesDeps = DeepReadonly<{
  generateOrderId: io.IO<OrderId>;
  generateTradeId: io.IO<TradeId>;
}>;
export type ForceExitOpeningTradesError = GeneralError<'ForceExitOpeningTradesFailed'>;
type ForceExitOpeningTradesResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: OrdersLists;
  trades: TradesLists;
}>;
export function forceExitOpeningTrades(
  deps: ForceExitOpeningTradesDeps,
  strategyModule: StrategyModule,
  orders: OrdersLists,
  trades: TradesLists,
  lastKline: Kline,
): ioe.IOEither<ForceExitOpeningTradesError, ForceExitOpeningTradesResult> {
  const { generateOrderId, generateTradeId } = deps;
  const { takerFeeRate, makerFeeRate, capitalCurrency, assetCurrency } = strategyModule;
  const { filledOrders } = orders;
  const { openingTrades, closedTrades } = trades;

  const openingQuantity = openingTrades
    .reduce((sum, trade) => sum.plus(trade.tradeQuantity), new Decimal(0))
    .toNumber();

  if (openingQuantity === 0) return ioe.right({ strategyModule, orders, trades });

  const currentDate = lastKline.closeTimestamp;
  const currentPrice = lastKline.close;
  const feeRates = { takerFeeRate, makerFeeRate };
  const currencies = { capitalCurrency, assetCurrency };
  const closeTradeDeps = { generateTradeId };

  const createFilledExitOrder = pipe(
    generateOrderId,
    io.map(
      (orderId) =>
        ({
          id: orderId,
          orderSide: 'EXIT',
          type: 'MARKET',
          quantity: openingQuantity as OrderQuantity,
          createdAt: currentDate,
          status: 'PENDING',
        }) as const,
    ),
    io.map((pendingOrder) =>
      createFilledOrder(pendingOrder, currentDate, currentPrice, feeRates, currencies),
    ),
  );

  return pipe(
    ioe.Do,
    ioe.bindW('exitOrder', () => ioe.fromIO(createFilledExitOrder)),
    ioe.let('newFilledOrders', ({ exitOrder }) => append(exitOrder, filledOrders)),
    ioe.bindW('newTrades', ({ exitOrder }) => closeTrades(closeTradeDeps, openingTrades, exitOrder)),
    ioe.let('updatedStrategy', ({ newTrades, newFilledOrders }) => ({
      ...updateStrategyModuleStats(strategyModule, newTrades.openingTrades, newTrades.closedTrades),
      totalFees: calculateTotalFeesFromFilledOrders(newFilledOrders, currencies),
    })),
    ioe.map(({ exitOrder, updatedStrategy, newTrades }) => ({
      strategyModule: updatedStrategy,
      orders: { ...orders, filledOrders: append(exitOrder, filledOrders) },
      trades: { openingTrades, closedTrades: concat(closedTrades, newTrades.closedTrades) },
    })),
    ioe.mapLeft((reason) =>
      createGeneralError('ForceExitOpeningTradesFailed', 'Forcing exit opening trades failed', reason),
    ),
  );
}
