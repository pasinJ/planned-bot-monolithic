import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, find, identity, isNotNil, propEq, propOr, reject } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import {
  isOrderTypeAllowed,
  validateWithLotSizeFilter,
  validateWithMarketLotSizeFilter,
  validateWithMinNotionalFilter,
  validateWithNotionalFilter,
  validateWithPriceFilter,
} from '#features/shared/bnbSymbol.js';
import { Price } from '#features/shared/kline.js';
import {
  CanceledOrder,
  FilledOrder,
  OpeningOrder,
  PendingOrder,
  RejectedOrder,
  SubmittedOrder,
  createCanceledOrder,
  createFilledOrder,
  createOpeningOrder,
  createRejectedOrder,
  createSubmittedOrder,
  shouldTreatLimitOrderAsMarketOrder,
} from '#features/shared/order.js';
import {
  StrategyModule,
  transformStrategyModuleWhenOrderTransitToCanceled,
  transformStrategyModuleWhenPendingOrderTransitToFilled,
  transformStrategyModuleWhenPendingOrderTransitToOpening,
} from '#features/shared/strategyExecutorModules/strategy.js';
import { Symbol } from '#features/shared/symbol.js';
import {
  ClosedTrade,
  OpeningTrade,
  TradeId,
  closeTrades,
  createOpeningTrade,
} from '#features/shared/trade.js';
import { DateService } from '#infra/services/date/service.js';
import { ValidDate } from '#shared/utils/date.js';

export type ProcessOrdersDeps = ProcessPendingMarketOrderDeps &
  ProcessPendingLimitOrderDeps &
  ProcessPendingStopMarketOrderDeps;
type ProcessOrdersResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: {
    openingOrders: OpeningOrder[];
    submittedOrders: SubmittedOrder[];
    filledOrders: FilledOrder[];
    canceledOrders: CanceledOrder[];
    rejectedOrders: RejectedOrder[];
  };
  trades: { openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] };
}>;

export function processPendingOrders(
  deps: ProcessOrdersDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{
    pendingOrders: PendingOrder[];
    openingOrders: OpeningOrder[];
    submittedOrders: SubmittedOrder[];
    filledOrders: FilledOrder[];
    canceledOrders: CanceledOrder[];
    rejectedOrders: RejectedOrder[];
  }>,
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  currentPrice: Price,
): io.IO<ProcessOrdersResult> {
  type ProcessResult =
    | ProcessPendingMarketOrderResult
    | ProcessPendingLimitOrderResult
    | ProcessPendingStopMarketOrderResult
    | ProcessPendingStopLimitOrderResult
    | ProcessPendingCancelOrderResult;

  const { pendingOrders, ...restOrders } = orders;

  return pendingOrders.reduce(
    (prevResult, pendingOrder) =>
      pipe(
        prevResult,
        io.chain(
          ({ strategyModule, orders, trades }): io.IO<ProcessResult> =>
            pendingOrder.type === 'MARKET'
              ? processPendingMarketOrder(deps, strategyModule, orders, trades, pendingOrder, currentPrice)
              : pendingOrder.type === 'LIMIT'
              ? processPendingLimitOrder(deps, strategyModule, orders, trades, pendingOrder, currentPrice)
              : pendingOrder.type === 'STOP_MARKET'
              ? processPendingStopMarketOrder(deps, strategyModule, orders, pendingOrder)
              : pendingOrder.type === 'STOP_LIMIT'
              ? processPendingStopLimitOrder(deps, strategyModule, orders, pendingOrder)
              : processPendingCancelOrder(deps, strategyModule, orders, pendingOrder),
        ),
        io.map((result) => ({
          strategyModule: result.strategyModule,
          orders: { ...orders, ...result.orders },
          trades: propOr(trades, 'trades', result),
        })),
      ),
    io.of({ strategyModule, orders: restOrders, trades }),
  );
}

export type ProcessPendingMarketOrderDeps = DeepReadonly<{
  dateService: DateService;
  generateTradeId: io.IO<TradeId>;
}>;
type ProcessPendingMarketOrderResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: { filledOrders: FilledOrder[]; rejectedOrders: RejectedOrder[] };
  trades: { openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] };
}>;
export function processPendingMarketOrder(
  deps: ProcessPendingMarketOrderDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{ filledOrders: FilledOrder[]; rejectedOrders: RejectedOrder[] }>,
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  marketOrder: Extract<PendingOrder, { type: 'MARKET' }>,
  currentPrice: Price,
): io.IO<ProcessPendingMarketOrderResult> {
  return processAsMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice);
}

function processAsMarketOrder(
  deps: ProcessPendingLimitOrderDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{ filledOrders: FilledOrder[]; rejectedOrders: RejectedOrder[] }>,
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  order: Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' }>,
  currentPrice: Price,
) {
  const { dateService, generateTradeId } = deps;
  const { symbol, takerFeeRate, makerFeeRate, capitalCurrency, assetCurrency } = strategyModule;
  const { filledOrders, rejectedOrders } = orders;
  const { openingTrades } = trades;

  const feeRates = { takerFeeRate, makerFeeRate };
  const currencies = { capitalCurrency, assetCurrency };

  type FilledMarketOrder = Extract<FilledOrder, { type: 'MARKET' }>;

  return pipe(
    dateService.getCurrentDate,
    io.chain((currentDate) =>
      pipe(
        ioe.fromEither(isOrderTypeAllowed(order.type, symbol)),
        ioe.chainEitherK(() => validateQuantity(order, symbol)),
        ioe.chainEitherK(() => validateMarketNotional(order, symbol, currentPrice)),
        ioe.let(
          'filledOrder',
          () =>
            createFilledOrder(order, currentDate, currentPrice, feeRates, currencies) as FilledMarketOrder,
        ),
        ioe.bindW('updatedStrategy', ({ filledOrder }) =>
          ioe.fromEither(transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder)),
        ),
        ioe.chainW(
          ({ filledOrder, updatedStrategy }): ioe.IOEither<string, ProcessPendingMarketOrderResult> => {
            if (filledOrder.orderSide === 'ENTRY') {
              return pipe(
                generateTradeId,
                io.map((tradeId) => createOpeningTrade(tradeId, filledOrder)),
                io.map((openingTrade) => ({
                  strategyModule: updatedStrategy,
                  orders: { ...orders, filledOrders: append(filledOrder, filledOrders) },
                  trades: { ...trades, openingTrades: append(openingTrade, openingTrades) },
                })),
                ioe.fromIO,
              );
            } else {
              return pipe(
                ioe.fromEither(closeTrades(openingTrades, filledOrder)),
                ioe.map((trades) => ({
                  strategyModule: updatedStrategy,
                  orders: { ...orders, filledOrders: append(filledOrder, filledOrders) },
                  trades,
                })),
              );
            }
          },
        ),
        ioe.match((reason) => {
          const rejectedOrder = createRejectedOrder(order, reason, currentDate);
          return {
            strategyModule: strategyModule,
            orders: { ...orders, rejectedOrders: append(rejectedOrder, rejectedOrders) },
            trades,
          };
        }, identity),
      ),
    ),
  );
}

export type ProcessPendingLimitOrderDeps = DeepReadonly<{
  dateService: DateService;
  generateTradeId: io.IO<TradeId>;
}>;
type ProcessPendingLimitOrderResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: { openingOrders: OpeningOrder[]; filledOrders: FilledOrder[]; rejectedOrders: RejectedOrder[] };
  trades: { openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] };
}>;
export function processPendingLimitOrder(
  deps: ProcessPendingLimitOrderDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{
    openingOrders: OpeningOrder[];
    filledOrders: FilledOrder[];
    rejectedOrders: RejectedOrder[];
  }>,
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  limitOrder: Extract<PendingOrder, { type: 'LIMIT' }>,
  currentPrice: Price,
): io.IO<ProcessPendingLimitOrderResult> {
  const { dateService } = deps;
  const { symbol } = strategyModule;
  const { openingOrders, rejectedOrders } = orders;

  function processAsLimitOrder(currentDate: ValidDate) {
    return pipe(
      ioe.fromEither(isOrderTypeAllowed(limitOrder.type, symbol)),
      ioe.chainEitherK(() => validateQuantity(limitOrder, symbol)),
      ioe.chainEitherK(() => validatePrice(limitOrder, symbol)),
      ioe.chainEitherK(() => validateNotional(limitOrder, symbol)),
      ioe.let('openingOrder', () => createOpeningOrder(limitOrder, currentDate)),
      ioe.bindW('updatedStrategy', ({ openingOrder }) =>
        ioe.fromEither(transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder)),
      ),
      ioe.map(({ openingOrder, updatedStrategy }) => ({
        strategyModule: updatedStrategy,
        orders: { ...orders, openingOrders: append(openingOrder, openingOrders) },
        trades,
      })),
      ioe.matchW((reason) => {
        const rejectedOrder = createRejectedOrder(limitOrder, reason, currentDate);
        return {
          strategyModule: strategyModule,
          orders: { ...orders, rejectedOrders: append(rejectedOrder, rejectedOrders) },
          trades,
        };
      }, identity),
    );
  }

  return pipe(
    dateService.getCurrentDate,
    io.chain((currentDate) =>
      shouldTreatLimitOrderAsMarketOrder(limitOrder, currentPrice)
        ? pipe(
            processAsMarketOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
            io.map(({ orders, ...rest }) => ({ orders: { ...orders, openingOrders }, ...rest })),
          )
        : processAsLimitOrder(currentDate),
    ),
  );
}

export type ProcessPendingStopMarketOrderDeps = DeepReadonly<{ dateService: DateService }>;
type ProcessPendingStopMarketOrderResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: { openingOrders: OpeningOrder[]; rejectedOrders: RejectedOrder[] };
}>;
export function processPendingStopMarketOrder(
  deps: ProcessPendingStopMarketOrderDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{ openingOrders: OpeningOrder[]; rejectedOrders: RejectedOrder[] }>,
  stopMarketOrder: Extract<PendingOrder, { type: 'STOP_MARKET' }>,
): io.IO<ProcessPendingStopMarketOrderResult> {
  const { dateService } = deps;
  const { symbol } = strategyModule;
  const { openingOrders, rejectedOrders } = orders;

  return pipe(
    dateService.getCurrentDate,
    io.chain((currentDate) =>
      pipe(
        ioe.fromEither(isOrderTypeAllowed(stopMarketOrder.type, symbol)),
        ioe.chainEitherK(() => validateQuantity(stopMarketOrder, symbol)),
        ioe.chainEitherK(() => validatePrice(stopMarketOrder, symbol)),
        ioe.chainEitherK(() => validateNotional(stopMarketOrder, symbol)),
        ioe.let('openingOrder', () => createOpeningOrder(stopMarketOrder, currentDate)),
        ioe.bindW('updatedStrategy', ({ openingOrder }) =>
          ioe.fromEither(
            transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder),
          ),
        ),
        ioe.map(({ openingOrder, updatedStrategy }) => ({
          strategyModule: updatedStrategy,
          orders: { ...orders, openingOrders: append(openingOrder, openingOrders) },
        })),
        ioe.matchW((reason) => {
          const rejectedOrder = createRejectedOrder(stopMarketOrder, reason, currentDate);
          return {
            strategyModule: strategyModule,
            orders: { ...orders, rejectedOrders: append(rejectedOrder, rejectedOrders) },
          };
        }, identity),
      ),
    ),
  );
}

export type ProcessPendingStopLimitOrderDeps = DeepReadonly<{ dateService: DateService }>;
type ProcessPendingStopLimitOrderResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: { openingOrders: OpeningOrder[]; rejectedOrders: RejectedOrder[] };
}>;
export function processPendingStopLimitOrder(
  deps: ProcessPendingStopLimitOrderDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{ openingOrders: OpeningOrder[]; rejectedOrders: RejectedOrder[] }>,
  stopLimitOrder: Extract<PendingOrder, { type: 'STOP_LIMIT' }>,
): io.IO<ProcessPendingStopLimitOrderResult> {
  const { dateService } = deps;
  const { symbol } = strategyModule;
  const { openingOrders, rejectedOrders } = orders;

  return pipe(
    dateService.getCurrentDate,
    io.chain((currentDate) =>
      pipe(
        ioe.fromEither(isOrderTypeAllowed(stopLimitOrder.type, symbol)),
        ioe.chainEitherK(() => validateQuantity(stopLimitOrder, symbol)),
        ioe.chainEitherK(() => validatePrice(stopLimitOrder, symbol)),
        ioe.chainEitherK(() => validateNotional(stopLimitOrder, symbol)),
        ioe.let('openingOrder', () => createOpeningOrder(stopLimitOrder, currentDate)),
        ioe.bindW('updatedStrategy', ({ openingOrder }) =>
          ioe.fromEither(
            transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder),
          ),
        ),
        ioe.map(({ openingOrder, updatedStrategy }) => ({
          strategyModule: updatedStrategy,
          orders: { ...orders, openingOrders: append(openingOrder, openingOrders) },
        })),
        ioe.matchW((reason) => {
          const rejectedOrder = createRejectedOrder(stopLimitOrder, reason, currentDate);
          return {
            strategyModule: strategyModule,
            orders: { ...orders, rejectedOrders: append(rejectedOrder, rejectedOrders) },
          };
        }, identity),
      ),
    ),
  );
}

export type ProcessPendingCancelOrderDeps = DeepReadonly<{ dateService: DateService }>;
type ProcessPendingCancelOrderResult = DeepReadonly<{
  strategyModule: StrategyModule;
  orders: {
    openingOrders: OpeningOrder[];
    submittedOrders: SubmittedOrder[];
    canceledOrders: CanceledOrder[];
    rejectedOrders: RejectedOrder[];
  };
}>;
export function processPendingCancelOrder(
  deps: ProcessPendingCancelOrderDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{
    openingOrders: OpeningOrder[];
    submittedOrders: SubmittedOrder[];
    canceledOrders: CanceledOrder[];
    rejectedOrders: RejectedOrder[];
  }>,
  cancelOrder: Extract<PendingOrder, { type: 'CANCEL' }>,
): io.IO<ProcessPendingCancelOrderResult> {
  const { dateService } = deps;
  const { openingOrders, submittedOrders, canceledOrders, rejectedOrders } = orders;
  const { orderIdToCancel } = cancelOrder;

  return pipe(
    dateService.getCurrentDate,
    io.chain((currentDate) =>
      pipe(
        find(propEq(orderIdToCancel, 'id'), openingOrders),
        e.fromPredicate(isNotNil, () => 'No matching opening order'),
        ioe.fromEither,
        ioe.matchW(
          (reason) => {
            const rejectedOrder = createRejectedOrder(cancelOrder, reason, currentDate);
            return {
              strategyModule,
              orders: { ...orders, rejectedOrders: append(rejectedOrder, rejectedOrders) },
            };
          },
          (orderToBeCanceled) => {
            const canceledOrder = createCanceledOrder(orderToBeCanceled, currentDate);
            const submittedOrder = createSubmittedOrder(cancelOrder, currentDate);
            const updatedStrategyModule = transformStrategyModuleWhenOrderTransitToCanceled(
              strategyModule,
              canceledOrder,
            );
            return {
              strategyModule: updatedStrategyModule,
              orders: {
                ...orders,
                openingOrders: reject(propEq(orderIdToCancel, 'id'), openingOrders),
                submittedOrders: append(submittedOrder, submittedOrders),
                canceledOrders: append(canceledOrder, canceledOrders),
              },
            };
          },
        ),
      ),
    ),
  );
}

function validateQuantity(
  order: Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  symbol: Symbol,
): e.Either<string, void> {
  return order.type === 'MARKET'
    ? pipe(
        e.sequenceArray([
          validateWithLotSizeFilter(order.quantity, symbol),
          validateWithMarketLotSizeFilter(order.quantity, symbol),
        ]),
        e.asUnit,
      )
    : validateWithLotSizeFilter(order.quantity, symbol);
}

function validateMarketNotional(
  order: Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' }>,
  symbol: Symbol,
  currentPrice: Price,
): e.Either<string, void> {
  return pipe(
    e.sequenceArray([
      validateWithMinNotionalFilter(order.quantity, currentPrice, true, symbol),
      validateWithNotionalFilter(order.quantity, currentPrice, true, symbol),
    ]),
    e.asUnit,
  );
}

function validateNotional(
  order: Extract<PendingOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  symbol: Symbol,
): e.Either<string, void> {
  const price = 'limitPrice' in order ? order.limitPrice : order.stopPrice;
  return pipe(
    e.sequenceArray([
      validateWithMinNotionalFilter(order.quantity, price, false, symbol),
      validateWithNotionalFilter(order.quantity, price, false, symbol),
    ]),
    e.asUnit,
  );
}

function validatePrice(
  order: Extract<PendingOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  symbol: Symbol,
): e.Either<string, void> {
  return order.type === 'LIMIT'
    ? validateWithPriceFilter(order.limitPrice, symbol)
    : order.type === 'STOP_MARKET'
    ? validateWithPriceFilter(order.stopPrice, symbol)
    : pipe(
        e.sequenceArray([
          validateWithPriceFilter(order.limitPrice, symbol),
          validateWithPriceFilter(order.stopPrice, symbol),
        ]),
        e.asUnit,
      );
}
