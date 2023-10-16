import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { __, allPass, append, concat, gte, lte, mergeRight, pick } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { Kline, Price } from '#features/shared/kline.js';
import {
  FilledOrder,
  OpeningOrder,
  OrderPrice,
  TriggeredOrder,
  createFilledOrder,
  createTriggeredOrder,
} from '#features/shared/order.js';
import {
  StrategyModule,
  updateStrategyModuleWhenOpeningOrderIsFilled,
} from '#features/shared/strategyExecutorContext/strategy.js';
import {
  ClosedTrade,
  OpeningTrade,
  TradeId,
  closeTrades,
  createFullOpeningTrade,
} from '#features/shared/trade.js';
import { DateService } from '#infra/services/date/service.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';

export type ProcessOpeningOrdersDeps = DeepReadonly<{
  dateService: DateService;
  generateTradeId: io.IO<TradeId>;
}>;
export type ProcessOpeningOrdersError = ProcessOpeningLimitOrderError | ProcessOpeningStopMarketOrderError;
type ProcessOpeningOrdersResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: { openingOrders: OpeningOrder[]; triggeredOrders: TriggeredOrder[]; filledOrders: FilledOrder[] };
  trades: { openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] };
}>;
export function processOpeningOrders(
  deps: ProcessOpeningOrdersDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{
    openingOrders: OpeningOrder[];
    triggeredOrders: TriggeredOrder[];
    filledOrders: FilledOrder[];
  }>,
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  currentKline: Kline,
): ioe.IOEither<ProcessOpeningOrdersError, ProcessOpeningOrdersResult> {
  const { openingOrders, triggeredOrders, filledOrders } = orders;

  type ProcessResult =
    | ProcessOpeningLimitOrderResult
    | ProcessOpeningStopMarketOrderResult
    | ProcessOpeningStopLimitOrderResult
    | { orders: { openingOrders: OpeningOrder[] } };

  return openingOrders.reduce(
    (prev: ioe.IOEither<ProcessOpeningOrdersError, ProcessOpeningOrdersResult>, openingOrder) =>
      pipe(
        ioe.Do,
        ioe.bindW('prevResult', () => prev),
        ioe.bindW(
          'currentResult',
          ({ prevResult }): ioe.IOEither<ProcessOpeningOrdersError, ProcessResult> => {
            const { strategyModule, orders, trades } = prevResult;
            const { openingOrders, triggeredOrders, filledOrders } = orders;

            return openingOrder.type === 'LIMIT' && shouldProcessOrder(currentKline, openingOrder.limitPrice)
              ? processOpeningLimitOrder(
                  deps,
                  strategyModule,
                  { filledOrders },
                  trades,
                  openingOrder,
                  currentKline,
                )
              : openingOrder.type === 'STOP_MARKET' &&
                shouldProcessOrder(currentKline, openingOrder.stopPrice)
              ? processOpeningStopMarketOrder(
                  deps,
                  strategyModule,
                  { filledOrders },
                  trades,
                  openingOrder,
                  currentKline,
                )
              : openingOrder.type === 'STOP_LIMIT' && shouldProcessOrder(currentKline, openingOrder.stopPrice)
              ? ioe.of(processOpeningStopLimitOrder({ triggeredOrders }, openingOrder, currentKline))
              : ioe.of({ orders: { openingOrders: append(openingOrder, openingOrders) } });
          },
        ),
        ioe.map(({ prevResult, currentResult }) => ({
          strategyModule:
            'strategyModule' in currentResult ? currentResult.strategyModule : prevResult.strategyModule,
          orders: mergeRight(prevResult.orders, currentResult.orders),
          trades: mergeRight(prevResult.trades, 'trades' in currentResult ? currentResult.trades : {}),
        })),
      ),
    ioe.of({ strategyModule, orders: { openingOrders: [], triggeredOrders, filledOrders }, trades }),
  );
}

export type ProcessOpeningLimitOrderDeps = DeepReadonly<{
  dateService: DateService;
  generateTradeId: io.IO<TradeId>;
}>;
export type ProcessOpeningLimitOrderError = GeneralError<'ProcessOpeningLimitOrderFailed'>;
type ProcessOpeningLimitOrderResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: { filledOrders: FilledOrder[] };
  trades: { openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] };
}>;
export function processOpeningLimitOrder(
  deps: ProcessOpeningLimitOrderDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{ filledOrders: FilledOrder[] }>,
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  openingOrder: Extract<OpeningOrder, { type: 'LIMIT' }>,
  currentKline: Kline,
): ioe.IOEither<ProcessOpeningLimitOrderError, ProcessOpeningLimitOrderResult> {
  const { dateService, generateTradeId } = deps;
  const { filledOrders } = orders;
  const { openingTrades, closedTrades } = trades;

  const filledPrice = openingOrder.limitPrice as number as Price;
  const feeRates = pick(['takerFeeRate', 'makerFeeRate'], strategyModule);
  const currencies = pick(['capitalCurrency', 'assetCurrency'], strategyModule);

  return shouldProcessOrder(currentKline, openingOrder.limitPrice)
    ? pipe(
        ioe.Do,
        ioe.bindW('currentDate', () => ioe.fromIO(dateService.getCurrentDate)),
        ioe.let('filledOrder', ({ currentDate }) =>
          createFilledOrder(openingOrder, currentDate, filledPrice, feeRates, currencies),
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
        ioe.mapLeft((reason) => createGeneralError('ProcessOpeningLimitOrderFailed', reason)),
      )
    : ioe.right({ strategyModule, orders, trades });
}

export type ProcessOpeningStopMarketOrderDeps = DeepReadonly<{
  dateService: DateService;
  generateTradeId: io.IO<TradeId>;
}>;
export type ProcessOpeningStopMarketOrderError = GeneralError<'ProcessOpeningLimitOrderFailed'>;
type ProcessOpeningStopMarketOrderResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: { filledOrders: FilledOrder[] };
  trades: { openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] };
}>;
export function processOpeningStopMarketOrder(
  deps: ProcessOpeningStopMarketOrderDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{ filledOrders: FilledOrder[] }>,
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  openingOrder: Extract<OpeningOrder, { type: 'STOP_MARKET' }>,
  currentKline: Kline,
): ioe.IOEither<ProcessOpeningStopMarketOrderError, ProcessOpeningStopMarketOrderResult> {
  const { dateService, generateTradeId } = deps;
  const { filledOrders } = orders;
  const { openingTrades, closedTrades } = trades;

  const filledPrice = openingOrder.stopPrice as number as Price;
  const feeRates = pick(['takerFeeRate', 'makerFeeRate'], strategyModule);
  const currencies = pick(['capitalCurrency', 'assetCurrency'], strategyModule);

  return shouldProcessOrder(currentKline, openingOrder.stopPrice)
    ? pipe(
        ioe.Do,
        ioe.bindW('currentDate', () => ioe.fromIO(dateService.getCurrentDate)),
        ioe.let('filledOrder', ({ currentDate }) =>
          createFilledOrder(openingOrder, currentDate, filledPrice, feeRates, currencies),
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
        ioe.mapLeft((reason) => createGeneralError('ProcessOpeningLimitOrderFailed', reason)),
      )
    : ioe.right({ strategyModule, orders, trades });
}

type ProcessOpeningStopLimitOrderResult = DeepReadonly<{
  orders: { triggeredOrders: TriggeredOrder[] };
}>;
export function processOpeningStopLimitOrder(
  orders: DeepReadonly<{ triggeredOrders: TriggeredOrder[] }>,
  openingOrder: Extract<OpeningOrder, { type: 'STOP_LIMIT' }>,
  currentKline: Kline,
): ProcessOpeningStopLimitOrderResult {
  return shouldProcessOrder(currentKline, openingOrder.stopPrice)
    ? { orders: { triggeredOrders: append(createTriggeredOrder(openingOrder), orders.triggeredOrders) } }
    : { orders };
}

function shouldProcessOrder(currentKline: Kline, price: OrderPrice): boolean {
  return allPass([gte(__, currentKline.low), lte(__, currentKline.high)])(price);
}
