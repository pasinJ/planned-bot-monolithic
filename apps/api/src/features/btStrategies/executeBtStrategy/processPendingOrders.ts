import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, concat, find, identity, isNotNil, propEq, propOr, reject } from 'ramda';
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
  OrderPrice,
  OrderQuantity,
  PendingOrder,
  PendingOrderRequest,
  RejectedOrder,
  SubmittedOrder,
  TriggeredOrder,
  createCanceledOrder,
  createFilledOrder,
  createOpeningOrder,
  createRejectedOrder,
  createSubmittedOrder,
  shouldTreatLimitOrderAsMarketOrder,
} from '#features/shared/order.js';
import {
  StrategyModule,
  updateStrategyModuleWhenOrderIsCanceled,
  updateStrategyModuleWhenPendingOrderIsFilled,
  updateStrategyModuleWhenPendingOrderIsOpened,
} from '#features/shared/strategyExecutorModules/strategy.js';
import { Symbol } from '#features/shared/symbol.js';
import {
  ClosedTrade,
  OpeningTrade,
  TradeId,
  closeTrades,
  createFullOpeningTrade,
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
    pendingOrders: PendingOrderRequest[];
    openingOrders: OpeningOrder[];
    triggeredOrders: TriggeredOrder[];
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
    (prev, pendingOrder) =>
      pipe(
        io.Do,
        io.bind('prevResult', () => prev),
        io.bind(
          'currentResult',
          ({ prevResult: { strategyModule, orders, trades } }): io.IO<ProcessResult> =>
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
        io.map(({ prevResult, currentResult }) => ({
          strategyModule: currentResult.strategyModule,
          orders: { ...prevResult.orders, ...currentResult.orders },
          trades: propOr(prevResult.trades, 'trades', currentResult),
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
  orderRequest: Extract<PendingOrderRequest, { type: 'MARKET' }>,
  currentPrice: Price,
): io.IO<ProcessPendingMarketOrderResult> {
  return processAsMarketOrder(deps, strategyModule, orders, trades, orderRequest, currentPrice);
}

function processAsMarketOrder(
  deps: ProcessPendingLimitOrderDeps,
  strategyModule: StrategyModule,
  orders: DeepReadonly<{ filledOrders: FilledOrder[]; rejectedOrders: RejectedOrder[] }>,
  trades: DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>,
  orderRequest: Extract<PendingOrderRequest, { type: 'MARKET' | 'LIMIT' }>,
  currentPrice: Price,
) {
  const { dateService, generateTradeId } = deps;
  const { symbol, takerFeeRate, makerFeeRate, capitalCurrency, assetCurrency } = strategyModule;
  const { filledOrders, rejectedOrders } = orders;
  const { openingTrades, closedTrades } = trades;

  const feeRates = { takerFeeRate, makerFeeRate };
  const currencies = { capitalCurrency, assetCurrency };

  const validatePendingRequest: e.Either<
    string,
    Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' }>
  > = orderRequest.type === 'MARKET'
    ? pipe(
        isOrderTypeAllowed('MARKET', symbol),
        e.chain(() => validateQuantity(orderRequest, symbol)),
        e.chainFirst(() => validateMarketNotional(orderRequest, symbol, currentPrice)),
        e.map((quantity) => ({ ...orderRequest, quantity })),
      )
    : pipe(
        isOrderTypeAllowed('MARKET', symbol),
        e.bind('quantity', () => validateQuantity(orderRequest, symbol)),
        e.bind('price', () => validatePrice(orderRequest, symbol)),
        e.chainFirst(() => validateMarketNotional(orderRequest, symbol, currentPrice)),
        e.map(({ quantity, price: { limitPrice } }) => ({ ...orderRequest, quantity, limitPrice })),
      );

  return pipe(
    dateService.getCurrentDate,
    io.chain((currentDate) =>
      pipe(
        ioe.fromEither(validatePendingRequest),
        ioe.let('filledOrder', (pendingOrder) =>
          createFilledOrder(pendingOrder, currentDate, currentPrice, feeRates, currencies),
        ),
        ioe.bindW('updatedStrategy', ({ filledOrder }) =>
          ioe.fromEither(updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder)),
        ),
        ioe.chainW(
          ({ filledOrder, updatedStrategy }): ioe.IOEither<string, ProcessPendingMarketOrderResult> => {
            if (filledOrder.orderSide === 'ENTRY') {
              return pipe(
                generateTradeId,
                io.map((tradeId) => createFullOpeningTrade(tradeId, filledOrder)),
                io.map((openingTrade) => ({
                  strategyModule: updatedStrategy,
                  orders: { ...orders, filledOrders: append(filledOrder, filledOrders) },
                  trades: { ...trades, openingTrades: append(openingTrade, openingTrades) },
                })),
                ioe.fromIO,
              );
            } else {
              return pipe(
                closeTrades({ generateTradeId }, openingTrades, filledOrder),
                ioe.map((newTrades) => ({
                  strategyModule: updatedStrategy,
                  orders: { ...orders, filledOrders: append(filledOrder, filledOrders) },
                  trades: {
                    openingTrades: newTrades.openingTrades,
                    closedTrades: concat(closedTrades, newTrades.closedTrades),
                  },
                })),
              );
            }
          },
        ),
        ioe.match((reason) => {
          const rejectedOrder = createRejectedOrder(orderRequest, reason, currentDate);
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
  orderRequest: Extract<PendingOrderRequest, { type: 'LIMIT' }>,
  currentPrice: Price,
): io.IO<ProcessPendingLimitOrderResult> {
  const { dateService } = deps;
  const { symbol } = strategyModule;
  const { openingOrders, rejectedOrders } = orders;

  const validatePendingRequest: e.Either<string, Extract<PendingOrder, { type: 'LIMIT' }>> = pipe(
    isOrderTypeAllowed(orderRequest.type, symbol),
    e.bind('quantity', () => validateQuantity(orderRequest, symbol)),
    e.bind('price', () => validatePrice(orderRequest, symbol)),
    e.chainFirst(() => validateNotional(orderRequest, symbol)),
    e.map(({ quantity, price: { limitPrice } }) => ({ ...orderRequest, quantity, limitPrice })),
  );

  function processAsLimitOrder(currentDate: ValidDate) {
    return pipe(
      ioe.fromEither(validatePendingRequest),
      ioe.let('openingOrder', (limitOrder) => createOpeningOrder(limitOrder, currentDate)),
      ioe.bindW('updatedStrategy', ({ openingOrder }) =>
        ioe.fromEither(updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder)),
      ),
      ioe.map(({ openingOrder, updatedStrategy }) => ({
        strategyModule: updatedStrategy,
        orders: { ...orders, openingOrders: append(openingOrder, openingOrders) },
        trades,
      })),
      ioe.matchW((reason) => {
        const rejectedOrder = createRejectedOrder(orderRequest, reason, currentDate);
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
      shouldTreatLimitOrderAsMarketOrder(orderRequest, currentPrice)
        ? pipe(
            processAsMarketOrder(deps, strategyModule, orders, trades, orderRequest, currentPrice),
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
  orderRequest: Extract<PendingOrderRequest, { type: 'STOP_MARKET' }>,
): io.IO<ProcessPendingStopMarketOrderResult> {
  const { dateService } = deps;
  const { symbol } = strategyModule;
  const { openingOrders, rejectedOrders } = orders;

  const validatePendingRequest: e.Either<string, Extract<PendingOrder, { type: 'STOP_MARKET' }>> = pipe(
    isOrderTypeAllowed(orderRequest.type, symbol),
    e.bind('quantity', () => validateQuantity(orderRequest, symbol)),
    e.bind('price', () => validatePrice(orderRequest, symbol)),
    e.chainFirst(() => validateNotional(orderRequest, symbol)),
    e.map(({ quantity, price: { stopPrice } }) => ({ ...orderRequest, quantity, stopPrice })),
  );

  return pipe(
    dateService.getCurrentDate,
    io.chain((currentDate) =>
      pipe(
        ioe.fromEither(validatePendingRequest),
        ioe.let('openingOrder', (stopMarketOrder) => createOpeningOrder(stopMarketOrder, currentDate)),
        ioe.bindW('updatedStrategy', ({ openingOrder }) =>
          ioe.fromEither(updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder)),
        ),
        ioe.map(({ openingOrder, updatedStrategy }) => ({
          strategyModule: updatedStrategy,
          orders: { ...orders, openingOrders: append(openingOrder, openingOrders) },
        })),
        ioe.matchW((reason) => {
          const rejectedOrder = createRejectedOrder(orderRequest, reason, currentDate);
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
  orderRequest: Extract<PendingOrderRequest, { type: 'STOP_LIMIT' }>,
): io.IO<ProcessPendingStopLimitOrderResult> {
  const { dateService } = deps;
  const { symbol } = strategyModule;
  const { openingOrders, rejectedOrders } = orders;

  const validatePendingRequest: e.Either<string, Extract<PendingOrder, { type: 'STOP_LIMIT' }>> = pipe(
    isOrderTypeAllowed(orderRequest.type, symbol),
    e.bind('quantity', () => validateQuantity(orderRequest, symbol)),
    e.bind('price', () => validatePrice(orderRequest, symbol)),
    e.chainFirst(() => validateNotional(orderRequest, symbol)),
    e.map(({ quantity, price: { stopPrice, limitPrice } }) => ({
      ...orderRequest,
      quantity,
      stopPrice,
      limitPrice,
    })),
  );

  return pipe(
    dateService.getCurrentDate,
    io.chain((currentDate) =>
      pipe(
        ioe.fromEither(validatePendingRequest),
        ioe.let('openingOrder', (stopLimitOrder) => createOpeningOrder(stopLimitOrder, currentDate)),
        ioe.bindW('updatedStrategy', ({ openingOrder }) =>
          ioe.fromEither(updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder)),
        ),
        ioe.map(({ openingOrder, updatedStrategy }) => ({
          strategyModule: updatedStrategy,
          orders: { ...orders, openingOrders: append(openingOrder, openingOrders) },
        })),
        ioe.matchW((reason) => {
          const rejectedOrder = createRejectedOrder(orderRequest, reason, currentDate);
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
    triggeredOrders: TriggeredOrder[];
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
    triggeredOrders: TriggeredOrder[];
    submittedOrders: SubmittedOrder[];
    canceledOrders: CanceledOrder[];
    rejectedOrders: RejectedOrder[];
  }>,
  cancelOrder: Extract<PendingOrderRequest, { type: 'CANCEL' }>,
): io.IO<ProcessPendingCancelOrderResult> {
  const { dateService } = deps;
  const { openingOrders, triggeredOrders, submittedOrders, canceledOrders, rejectedOrders } = orders;
  const { orderIdToCancel } = cancelOrder;

  return pipe(
    dateService.getCurrentDate,
    io.chain((currentDate) =>
      pipe(
        concat<OpeningOrder | TriggeredOrder, TriggeredOrder>(openingOrders, triggeredOrders),
        find<OpeningOrder | TriggeredOrder>(propEq(orderIdToCancel, 'id')),
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
            const updatedStrategyModule = updateStrategyModuleWhenOrderIsCanceled(
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
  order: Extract<PendingOrderRequest, { type: 'MARKET' | 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  symbol: Symbol,
): e.Either<string, OrderQuantity> {
  return order.type === 'MARKET'
    ? pipe(
        e.sequenceArray([
          validateWithLotSizeFilter(order.quantity, symbol),
          validateWithMarketLotSizeFilter(order.quantity, symbol),
        ]),
        e.as(order.quantity as OrderQuantity),
      )
    : pipe(validateWithLotSizeFilter(order.quantity, symbol), e.as(order.quantity as OrderQuantity));
}

function validateMarketNotional(
  order: Extract<PendingOrderRequest, { type: 'MARKET' | 'LIMIT' }>,
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
  order: Extract<PendingOrderRequest, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
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
  order: Extract<PendingOrderRequest, { type: 'LIMIT' }>,
  symbol: Symbol,
): e.Either<string, { limitPrice: OrderPrice }>;
function validatePrice(
  order: Extract<PendingOrderRequest, { type: 'STOP_MARKET' }>,
  symbol: Symbol,
): e.Either<string, { stopPrice: OrderPrice }>;
function validatePrice(
  order: Extract<PendingOrderRequest, { type: 'STOP_LIMIT' }>,
  symbol: Symbol,
): e.Either<string, { limitPrice: OrderPrice; stopPrice: OrderPrice }>;
function validatePrice<
  O extends Extract<PendingOrderRequest, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
>(order: O, symbol: Symbol) {
  return order.type === 'LIMIT'
    ? pipe(
        validateWithPriceFilter(order.limitPrice, symbol),
        e.as({ limitPrice: order.limitPrice as OrderPrice }),
      )
    : order.type === 'STOP_MARKET'
    ? pipe(
        validateWithPriceFilter(order.stopPrice, symbol),
        e.as({ stopPrice: order.stopPrice as OrderPrice }),
      )
    : pipe(
        e.sequenceArray([
          validateWithPriceFilter(order.limitPrice, symbol),
          validateWithPriceFilter(order.stopPrice, symbol),
        ]),
        e.as({ limitPrice: order.limitPrice as OrderPrice, stopPrice: order.stopPrice as OrderPrice }),
      );
}
