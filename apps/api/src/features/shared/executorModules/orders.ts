import { utcToZonedTime } from 'date-fns-tz/fp';
import { Decimal } from 'decimal.js';
import io from 'fp-ts/lib/IO.js';
import ior from 'fp-ts/lib/IORef.js';
import { flow, pipe } from 'fp-ts/lib/function.js';
import {
  __,
  anyPass,
  append,
  concat,
  equals,
  filter,
  isEmpty,
  isNotNil,
  prop,
  propEq,
  propSatisfies,
  reject,
  uniqWith,
} from 'ramda';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { BtStrategyModel } from '#features/btStrategies/dataModels/btStrategy.js';
import { Price } from '#features/btStrategies/dataModels/kline.js';
import { AssetName, SymbolName } from '#features/symbols/dataModels/symbol.js';
import { DateService } from '#infra/services/date/service.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeIo } from '#shared/utils/fp.js';
import { isUndefined } from '#shared/utils/general.js';

import type { StrategyModule } from './strategy.js';

export type OrdersModule = DeepReadonly<{
  /**   Enter a trading position with a market order (Taker)
   * A market order is an instruction to buy immediately (at the market’s current price).
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   * @returns void
   */
  enterMarket: (request: { quantity?: number }) => void;
  /**   Enter a trading position with a limit order (Maker)
   * A limit order is an instruction to wait until the price hits a limit or better price before being executed.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'limitPrice' specifies limit price of order.
   * @returns void
   */
  enterLimit: (request: { quantity: number; limitPrice: number }) => void;
  /**   Enter a trading position with a stop market order (Taker)
   * Once the stop price is reached, it will automatically trigger a market order.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'stopPrice' specifies the price that will trigger the market order.
   * @returns void
   */
  enterStopMarket: (request: { quantity: number; stopPrice: number }) => void;
  /**   Enter a trading position with a stop limit order (Maker)
   * Once the stop price is reached, it will automatically trigger a limit order.
   * The order will then execute if the market price matches the limit price or better.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'stopPrice' specifies the price that will trigger the limit order.
   *    - 'limitPrice' specifies the price of limit order.
   * @returns void
   */
  enterStopLimit: (request: { quantity: number; stopPrice: number; limitPrice: number }) => void;
  /**   Exit a trading position with a market order (Taker)
   * A market order is an instruction to sell immediately (at the market’s current price).
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   * @returns void
   */
  exitMarket: (request: { quantity?: number }) => void;
  /**   Exit a trading position with a limit order (Maker)
   * A limit order is an instruction to wait until the price hits a limit or better price before being executed.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'limitPrice' specifies limit price of order.
   * @returns void
   */
  exitLimit: (request: { quantity: number; limitPrice: number }) => void;
  /**   Exit a trading position with a stop market order (Taker)
   * Once the stop price is reached, it will automatically trigger a market order.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'stopPrice' specifies the price that will trigger the market order.
   * @returns void
   */
  exitStopMarket: (request: { quantity: number; stopPrice: number }) => void;
  /**   Exit a trading position with a stop limit order (Maker)
   * Once the stop price is reached, it will automatically trigger a limit order.
   * The order will then execute if the market price matches the limit price or better.
   * Limit orders will be rejected if they would immediately match and trade as a taker.
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'stopPrice' specifies the price that will trigger the limit order.
   *    - 'limitPrice' specifies the price of limit order.
   * @returns void
   */
  exitStopLimit: (request: { quantity: number; stopPrice: number; limitPrice: number }) => void;
  /**   Cancel a pending or opening order by referencing their ID
   * @returns void
   */
  cancelOrder: (orderId: OrderId) => void;
  /**   Cancel pending and opening orders
   * @returns void
   */
  cancelAllOrders: (request?: {
    type?: readonly ('ENTRY' | 'EXIT' | 'CANCEL')[];
    status?: 'PENDING' | 'OPENING' | 'ALL';
  }) => void;
  getPendingOrders: () => readonly PendingOrder[];
  getOpeningOrders: () => readonly OpeningOrder[];
}>;

export type Order = MarketOrder | LimitOrder | StopMarketOrder | StopLimitOrder | CancelOrder;

export type MarketOrder = DeepReadonly<BaseOrder & Market & (Pending | Filled | Rejected)>;
export type LimitOrder = DeepReadonly<BaseOrder & Limit & (Pending | Opening | Filled | Canceled | Rejected)>;
export type StopMarketOrder = DeepReadonly<
  BaseOrder & StopMarket & (Pending | Opening | Filled | Canceled | Rejected)
>;
export type StopLimitOrder = DeepReadonly<
  BaseOrder & StopLimit & (Pending | Opening | Filled | Canceled | Rejected)
>;
export type CancelOrder = DeepReadonly<CancelBaseOrder & Cancel & (Pending | Submitted | Rejected)>;

export type PendingOrder = DeepReadonly<
  (BaseOrder & (Market | Limit | StopMarket | StopLimit) & Pending) | (CancelBaseOrder & Cancel & Pending)
>;
export type SubmittedOrder = DeepReadonly<CancelBaseOrder & Cancel & Submitted>;
export type OpeningOrder = DeepReadonly<BaseOrder & (Limit | StopMarket | StopLimit) & Opening>;
export type FilledOrder = DeepReadonly<BaseOrder & (Market | Limit | StopMarket | StopLimit) & Filled>;
export type CanceledOrder = DeepReadonly<BaseOrder & (Limit | StopMarket | StopLimit) & Canceled>;
export type RejectedOrder = DeepReadonly<
  (BaseOrder & (Market | Limit | StopMarket | StopLimit) & Rejected) | (CancelBaseOrder & Cancel & Rejected)
>;

type BaseOrder = { id: OrderId; symbol: SymbolName; createdAt: ValidDate } & (Entry | Exit);
type CancelBaseOrder = { id: OrderId; symbol: SymbolName; createdAt: ValidDate };

export type OrderId = string & z.BRAND<'OrderId'>;

type Entry = { orderSide: 'ENTRY' };
type Exit = { orderSide: 'EXIT' };

type Market = { type: 'MARKET'; quantity: number };
type Limit = { type: 'LIMIT'; quantity: number; limitPrice: number };
type StopMarket = { type: 'STOP_MARKET'; quantity: number; stopPrice: number };
type StopLimit = { type: 'STOP_LIMIT'; quantity: number; stopPrice: number; limitPrice: number };
type Cancel = { type: 'CANCEL'; orderIdToCancel: OrderId };

type Pending = { status: 'PENDING' };
type Submitted = { status: 'SUBMITTED'; submittedAt: ValidDate };
type Opening = { status: 'OPENING'; submittedAt: ValidDate };
type Filled = { status: 'FILLED'; filledPrice: Price; fee: Fee; submittedAt: ValidDate; filledAt: ValidDate };
type Canceled = { status: 'CANCELED'; submittedAt: ValidDate; canceledAt: ValidDate };
type Rejected = { status: 'REJECTED'; submittedAt: ValidDate; reason: string };

export type Fee = Readonly<{ amount: FeeAmount; currency: AssetName }>;
export type FeeAmount = number & z.BRAND<'FeeAmount'>;

export type OrdersModuleDeps = DeepReadonly<{
  dateService: DateService;
  generateOrderId: io.IO<OrderId>;
}>;

export function buildOrdersModule(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  openingOrders: readonly OpeningOrder[],
): OrdersModule {
  const pendingOrdersRef = new ior.IORef([] as readonly PendingOrder[]);

  return {
    enterMarket: enterMarket(deps, strategy, pendingOrdersRef),
    enterLimit: enterLimit(deps, strategy, pendingOrdersRef),
    enterStopMarket: enterStopMarket(deps, strategy, pendingOrdersRef),
    enterStopLimit: enterStopLimit(deps, strategy, pendingOrdersRef),
    exitMarket: exitMarket(deps, strategy, pendingOrdersRef),
    exitLimit: exitLimit(deps, strategy, pendingOrdersRef),
    exitStopMarket: exitStopMarket(deps, strategy, pendingOrdersRef),
    exitStopLimit: exitStopLimit(deps, strategy, pendingOrdersRef),
    cancelOrder: cancelOrder(deps, strategy, pendingOrdersRef, openingOrders),
    cancelAllOrders: cancelAllOrders(deps, strategy, pendingOrdersRef, openingOrders),
    getPendingOrders: pendingOrdersRef.read,
    getOpeningOrders: () => openingOrders,
  };
}

function enterMarket(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  pendingOrdersRef: ior.IORef<readonly PendingOrder[]>,
) {
  return (request: { quantity?: number }): void => {
    const { symbol, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            orderSide: 'ENTRY',
            createdAt,
            type: 'MARKET',
            status: 'PENDING',
            ...request,
          }) as PendingOrder,
      ),
      io.chain((order) => pendingOrdersRef.modify(append(order))),
      executeIo,
    );
  };
}

function enterLimit(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  pendingOrdersRef: ior.IORef<readonly PendingOrder[]>,
) {
  return (request: { quantity: number; limitPrice: number }): void => {
    const { symbol, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            orderSide: 'ENTRY',
            createdAt,
            type: 'LIMIT',
            status: 'PENDING',
            ...request,
          }) as PendingOrder,
      ),
      io.chain((order) => pendingOrdersRef.modify(append(order))),
      executeIo,
    );
  };
}

function enterStopMarket(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  pendingOrdersRef: ior.IORef<readonly PendingOrder[]>,
) {
  return (request: { quantity: number; stopPrice: number }): void => {
    const { symbol, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            orderSide: 'ENTRY',
            createdAt,
            type: 'STOP_MARKET',
            status: 'PENDING',
            ...request,
          }) as PendingOrder,
      ),
      io.chain((order) => pendingOrdersRef.modify(append(order))),
      executeIo,
    );
  };
}

function enterStopLimit(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  pendingOrdersRef: ior.IORef<readonly PendingOrder[]>,
) {
  return (request: { quantity: number; stopPrice: number; limitPrice: number }): void => {
    const { symbol, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            orderSide: 'ENTRY',
            createdAt,
            type: 'STOP_LIMIT',
            status: 'PENDING',
            ...request,
          }) as PendingOrder,
      ),
      io.chain((order) => pendingOrdersRef.modify(append(order))),
      executeIo,
    );
  };
}

function exitMarket(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  pendingOrdersRef: ior.IORef<readonly PendingOrder[]>,
) {
  return (request: { quantity?: number }): void => {
    const { symbol, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            orderSide: 'EXIT',
            createdAt,
            type: 'MARKET',
            status: 'PENDING',
            ...request,
          }) as PendingOrder,
      ),
      io.chain((order) => pendingOrdersRef.modify(append(order))),
      executeIo,
    );
  };
}

function exitLimit(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  pendingOrdersRef: ior.IORef<readonly PendingOrder[]>,
) {
  return (request: { quantity: number; limitPrice: number }): void => {
    const { symbol, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            orderSide: 'EXIT',
            createdAt,
            type: 'LIMIT',
            status: 'PENDING',
            ...request,
          }) as PendingOrder,
      ),
      io.chain((order) => pendingOrdersRef.modify(append(order))),
      executeIo,
    );
  };
}

function exitStopMarket(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  pendingOrdersRef: ior.IORef<readonly PendingOrder[]>,
) {
  return (request: { quantity: number; stopPrice: number }): void => {
    const { symbol, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            orderSide: 'EXIT',
            createdAt,
            type: 'STOP_MARKET',
            status: 'PENDING',
            ...request,
          }) as PendingOrder,
      ),
      io.chain((order) => pendingOrdersRef.modify(append(order))),
      executeIo,
    );
  };
}

function exitStopLimit(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  pendingOrdersRef: ior.IORef<readonly PendingOrder[]>,
) {
  return (request: { quantity: number; stopPrice: number; limitPrice: number }): void => {
    const { symbol, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            orderSide: 'EXIT',
            createdAt,
            type: 'STOP_LIMIT',
            status: 'PENDING',
            ...request,
          }) as PendingOrder,
      ),
      io.chain((order) => pendingOrdersRef.modify(append(order))),
      executeIo,
    );
  };
}

function cancelOrder(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  pendingOrdersRef: ior.IORef<readonly PendingOrder[]>,
  openingOrders: readonly OpeningOrder[],
) {
  return (orderId: OrderId): void =>
    pipe(
      openingOrders.find(propEq(orderId, 'id')),
      (openingOrder) =>
        isUndefined(openingOrder)
          ? pendingOrdersRef.modify(reject(propEq(orderId, 'id')))
          : pipe(
              createCancelOrder(deps, strategy, orderId),
              io.chain((cancelOrder) =>
                pendingOrdersRef.modify(flow(append(cancelOrder), uniqWith(removeDuplicateCancelOrder))),
              ),
            ),
      executeIo,
    );
}

function cancelAllOrders(
  deps: OrdersModuleDeps,
  strategy: BtStrategyModel,
  pendingOrdersRef: ior.IORef<readonly PendingOrder[]>,
  openingOrders: readonly OpeningOrder[],
) {
  return (
    {
      type = ['ENTRY', 'EXIT', 'CANCEL'],
      status = 'ALL',
    }: {
      type?: readonly ('ENTRY' | 'EXIT' | 'CANCEL')[];
      status?: 'PENDING' | 'OPENING' | 'ALL';
    } = { type: ['ENTRY', 'EXIT', 'CANCEL'], status: 'ALL' },
  ) => {
    const cancelFilter = [
      type.includes('ENTRY') ? propSatisfies(equals('ENTRY'), 'orderSide') : undefined,
      type.includes('EXIT') ? propSatisfies(equals('EXIT'), 'orderSide') : undefined,
      type.includes('CANCEL') ? propSatisfies(equals('CANCEL'), 'type') : undefined,
    ].filter(isNotNil);
    const orderIdsToCancel =
      status === 'PENDING' ? [] : filter(anyPass(cancelFilter), openingOrders).map(prop('id'));

    return pipe(
      status !== 'OPENING' ? pendingOrdersRef.modify(reject(anyPass(cancelFilter))) : io.of(undefined),
      io.chain(() =>
        !isEmpty(orderIdsToCancel)
          ? pipe(
              orderIdsToCancel.map((orderId) => createCancelOrder(deps, strategy, orderId)),
              io.sequenceArray,
              io.chain((cancelOrders) =>
                pendingOrdersRef.modify(flow(concat(__, cancelOrders), uniqWith(removeDuplicateCancelOrder))),
              ),
            )
          : io.of(undefined),
      ),
      executeIo,
    );
  };
}

function createCancelOrder(deps: OrdersModuleDeps, strategy: BtStrategyModel, orderId: OrderId) {
  const { symbol, timezone } = strategy;
  return pipe(
    io.Do,
    io.bind('id', () => deps.generateOrderId),
    io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
    io.map(
      ({ id, createdAt }) =>
        ({
          id,
          symbol,
          createdAt: createdAt as ValidDate,
          type: 'CANCEL',
          orderIdToCancel: orderId,
          status: 'PENDING',
        }) as PendingOrder,
    ),
  );
}

function removeDuplicateCancelOrder(x: PendingOrder, y: PendingOrder) {
  return x.type === 'CANCEL' && y.type === 'CANCEL' && x.orderIdToCancel === y.orderIdToCancel ? true : false;
}

export function shouldTreatLimitOrderAsMarketOrder(limitOrder: LimitOrder, currentPrice: Price): boolean {
  return (
    (limitOrder.orderSide === 'ENTRY' && limitOrder.limitPrice >= currentPrice) ||
    (limitOrder.orderSide === 'EXIT' && limitOrder.limitPrice <= currentPrice)
  );
}

export function calculateFee(
  strategy: StrategyModule,
  order:
    | Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' }>
    | Extract<OpeningOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  currentPrice: Price,
): Fee {
  const { takerFeeRate, makerFeeRate, baseCurrency, assetCurrency } = strategy;
  const { type, quantity } = order;

  const currency = order.orderSide === 'ENTRY' ? assetCurrency : baseCurrency;
  const feeRate =
    type === 'MARKET' ||
    type === 'STOP_MARKET' ||
    (type === 'LIMIT' && shouldTreatLimitOrderAsMarketOrder(order, currentPrice))
      ? takerFeeRate
      : makerFeeRate;
  const fillPrice =
    type === 'MARKET' || (type === 'LIMIT' && shouldTreatLimitOrderAsMarketOrder(order, currentPrice))
      ? currentPrice
      : 'limitPrice' in order
      ? order.limitPrice
      : order.stopPrice;
  const amount = (
    order.orderSide === 'ENTRY' ? new Decimal(quantity) : new Decimal(quantity).times(fillPrice)
  )
    .times(feeRate)
    .dividedBy(100)
    .toDecimalPlaces(8, Decimal.ROUND_UP)
    .toNumber();

  return { amount, currency } as Fee;
}

export function createOpeningOrder(
  order: Extract<PendingOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  currentDate: ValidDate,
): OpeningOrder {
  return {
    ...order,
    status: 'OPENING',
    submittedAt: currentDate,
  };
}

export function createSubmittedOrder(
  order: Extract<PendingOrder, { type: 'CANCEL' }>,
  currentDate: ValidDate,
): SubmittedOrder {
  return { ...order, status: 'SUBMITTED', submittedAt: currentDate };
}

export function createFilledOrder(
  strategy: StrategyModule,
  order:
    | Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' }>
    | Extract<OpeningOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  currentDate: ValidDate,
  currentPrice: Price,
): FilledOrder {
  return {
    ...order,
    status: 'FILLED',
    filledPrice: currentPrice,
    fee: calculateFee(strategy, order, currentPrice),
    submittedAt: currentDate,
    filledAt: currentDate,
  };
}

export function createCanceledOrder(
  order: Extract<OpeningOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  currentDate: ValidDate,
): CanceledOrder {
  return { ...order, status: 'CANCELED', canceledAt: currentDate };
}

export function createRejectedOrder(
  order: PendingOrder | SubmittedOrder | OpeningOrder,
  reason: string,
  currentDate: ValidDate,
): RejectedOrder {
  return {
    ...order,
    status: 'REJECTED',
    reason,
    submittedAt: currentDate,
  };
}
