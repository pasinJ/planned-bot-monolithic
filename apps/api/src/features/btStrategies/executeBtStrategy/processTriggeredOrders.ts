import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { __, allPass, append, concat, gte, lte, mergeRight, pick } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { Kline, Price } from '#features/shared/kline.js';
import { FilledOrder, OrderPrice, TriggeredOrder, createFilledOrder } from '#features/shared/order.js';
import {
  StrategyModule,
  updateStrategyModuleWhenOpeningOrderIsFilled,
} from '#features/shared/strategyExecutorModules/strategy.js';
import {
  ClosedTrade,
  OpeningTrade,
  TradeId,
  closeTrades,
  createFullOpeningTrade,
} from '#features/shared/trade.js';
import { DateService } from '#infra/services/date/service.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';

export type ProcessTriggeredOrdersDeps = DeepReadonly<{
  dateService: DateService;
  generateTradeId: io.IO<TradeId>;
}>;
export type ProcessTriggeredOrdersError = ProcessTriggeredStopLimitOrderError;
type ProcessTriggeredOrdersResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: { triggeredOrders: TriggeredOrder[]; filledOrders: FilledOrder[] };
  trades: { openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] };
}>;
export function processTriggeredOrders(
  deps: ProcessTriggeredOrdersDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{ triggeredOrders: TriggeredOrder[]; filledOrders: FilledOrder[] }>,
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  currentKline: Kline,
): ioe.IOEither<ProcessTriggeredOrdersError, ProcessTriggeredOrdersResult> {
  const { triggeredOrders, filledOrders } = orders;

  type ProcessResult =
    | ProcessTriggeredStopLimitOrderResult
    | { orders: { triggeredOrders: TriggeredOrder[] } };

  return triggeredOrders.reduce(
    (prev: ioe.IOEither<ProcessTriggeredOrdersError, ProcessTriggeredOrdersResult>, triggeredOrder) =>
      pipe(
        ioe.Do,
        ioe.bindW('prevResult', () => prev),
        ioe.bindW(
          'currentResult',
          ({ prevResult }): ioe.IOEither<ProcessTriggeredOrdersError, ProcessResult> => {
            const { strategyModule, orders, trades } = prevResult;
            const { triggeredOrders, filledOrders } = orders;

            return shouldProcessOrder(currentKline, triggeredOrder.limitPrice)
              ? processTriggeredStopLimitOrder(
                  deps,
                  strategyModule,
                  { filledOrders },
                  trades,
                  triggeredOrder,
                  currentKline,
                )
              : ioe.of({ orders: { triggeredOrders: append(triggeredOrder, triggeredOrders) } });
          },
        ),
        ioe.map(({ prevResult, currentResult }) => ({
          strategyModule:
            'strategyModule' in currentResult ? currentResult.strategyModule : prevResult.strategyModule,
          orders: mergeRight(prevResult.orders, currentResult.orders),
          trades: mergeRight(prevResult.trades, 'trades' in currentResult ? currentResult.trades : {}),
        })),
      ),
    ioe.of({ strategyModule, orders: { triggeredOrders: [], filledOrders }, trades }),
  );
}

export type ProcessTriggeredStopLimitOrderDeps = DeepReadonly<{
  dateService: DateService;
  generateTradeId: io.IO<TradeId>;
}>;
type ProcessTriggeredStopLimitOrderError = GeneralError<'ProcessTriggeredStopLimitOrderError'>;
type ProcessTriggeredStopLimitOrderResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: { filledOrders: FilledOrder[] };
  trades: { openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] };
}>;
export function processTriggeredStopLimitOrder(
  deps: ProcessTriggeredStopLimitOrderDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{ filledOrders: FilledOrder[] }>,
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  triggeredOrder: TriggeredOrder,
  currentKline: Kline,
): ioe.IOEither<ProcessTriggeredStopLimitOrderError, ProcessTriggeredStopLimitOrderResult> {
  const { dateService, generateTradeId } = deps;
  const { filledOrders } = orders;
  const { openingTrades, closedTrades } = trades;

  const filledPrice = triggeredOrder.limitPrice as number as Price;
  const feeRates = pick(['takerFeeRate', 'makerFeeRate'], strategyModule);
  const currencies = pick(['capitalCurrency', 'assetCurrency'], strategyModule);

  return shouldProcessOrder(currentKline, triggeredOrder.limitPrice)
    ? pipe(
        ioe.Do,
        ioe.bindW('currentDate', () => ioe.fromIO(dateService.getCurrentDate)),
        ioe.let('filledOrder', ({ currentDate }) =>
          createFilledOrder(triggeredOrder, currentDate, filledPrice, feeRates, currencies),
        ),
        ioe.bindW('updatedStrategy', ({ filledOrder }) =>
          ioe.fromEither(updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder)),
        ),
        ioe.chainW(({ filledOrder, updatedStrategy }) => {
          if (filledOrder.orderSide === 'ENTRY') {
            return pipe(
              generateTradeId,
              io.map((tradeId) => createFullOpeningTrade(tradeId, filledOrder, currentKline)),
              io.map((openingTrade) => ({
                strategyModule: updatedStrategy,
                orders: { filledOrders: append(filledOrder, filledOrders) },
                trades: { ...trades, openingTrades: append(openingTrade, openingTrades) },
              })),
              ioe.fromIO,
            );
          } else {
            return pipe(
              closeTrades({ generateTradeId }, openingTrades, filledOrder),
              ioe.map((newTrades) => ({
                strategyModule: updatedStrategy,
                orders: { filledOrders: append(filledOrder, filledOrders) },
                trades: {
                  openingTrades: newTrades.openingTrades,
                  closedTrades: concat(closedTrades, newTrades.closedTrades) as readonly ClosedTrade[],
                },
              })),
            );
          }
        }),
        ioe.mapLeft((reason) => createGeneralError('ProcessTriggeredStopLimitOrderError', reason)),
      )
    : ioe.right({ strategyModule, orders, trades });
}

function shouldProcessOrder(currentKline: Kline, price: OrderPrice): boolean {
  return allPass([gte(__, currentKline.low), lte(__, currentKline.high)])(price);
}
