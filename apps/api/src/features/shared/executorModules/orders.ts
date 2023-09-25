import { utcToZonedTime } from 'date-fns-tz/fp';
import io from 'fp-ts/lib/IO.js';
import ior from 'fp-ts/lib/IORef.js';
import { flow, pipe } from 'fp-ts/lib/function.js';
import {
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

export type OrdersModule = {
  /**   Enter a trading position with a market order (Taker)
   * A market order is an instruction to buy immediately (at the market’s current price).
   * @param request can be either 'quantity' or 'quoteQuantity'
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   *    - 'quoteQuantity' specifies the amount the user wants to spend the quote asset.
   * @returns void
   */
  enterMarket: (request: { quantity?: number } | { quoteQuantity?: number }) => void;
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
   * @param request can be either 'quantity' or 'quoteQuantity'
   *    - 'quantity' specifies the amount of the base asset the user wants to sell at the market price.
   *    - 'quoteQuantity' specifies the amount the user wants to receive the quote asset.
   * @returns void
   */
  exitMarket: (request: { quantity?: number } | { quoteQuantity?: number }) => void;
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
    side?: readonly ('ENTRY' | 'EXIT' | 'CANCEL')[];
    status?: 'PENDING' | 'OPENING' | 'ALL';
  }) => void;
  getPendingOrders: () => readonly PendingOrder[];
  getOpeningOrders: () => readonly OpeningOrder[];
};

export type Order = MarketOrder | LimitOrder | StopMarketOrder | StopLimitOrder | CancelOrder;

export type MarketOrder = BaseOrder & Market & (Pending | Opening | Filled | Canceled | Rejected);
export type LimitOrder = BaseOrder & Limit & (Pending | Opening | Filled | Canceled | Rejected);
export type StopMarketOrder = BaseOrder & StopMarket & (Pending | Opening | Filled | Canceled | Rejected);
export type StopLimitOrder = BaseOrder & StopLimit & (Pending | Opening | Filled | Canceled | Rejected);
export type CancelOrder = CancelBaseOrder & Cancel & (Pending | Submitted | Rejected);

export type PendingOrder =
  | (BaseOrder & (Market | Limit | StopMarket | StopLimit) & Pending)
  | (CancelBaseOrder & Cancel & Pending);
export type SubmittedOrder = (BaseOrder & Market & Submitted) | (CancelBaseOrder & Cancel & Submitted);
export type OpeningOrder = BaseOrder & (Limit | StopMarket | StopLimit) & Opening;
export type FilledOrder = BaseOrder & (Market | Limit | StopMarket | StopLimit) & Filled;
export type CanceledOrder = BaseOrder & (Limit | StopMarket | StopLimit) & Canceled;
export type RejectedOrder =
  | (BaseOrder & (Market | Limit | StopMarket | StopLimit) & Rejected)
  | (CancelBaseOrder & Cancel & Rejected);

type BaseOrder = {
  id: OrderId;
  symbol: SymbolName;
  isEntry: boolean;
  currency: AssetName;
  createdAt: ValidDate;
};
type CancelBaseOrder = { id: OrderId; symbol: SymbolName; createdAt: ValidDate };

export type OrderId = string & z.BRAND<'OrderId'>;

type Market = { type: 'MARKET' } & ({ quantity: number } | { quoteQuantity: number });
type Limit = { type: 'LIMIT'; quantity: number; limitPrice: number };
type StopMarket = { type: 'STOP_MARKET'; quantity: number; stopPrice: number };
type StopLimit = { type: 'STOP_LIMIT'; quantity: number; stopPrice: number; limitPrice: number };
type Cancel = { type: 'CANCEL'; orderIdToCancel: OrderId };

type Pending = { status: 'PENDING' };
type Submitted = { status: 'SUBMITTED'; submittedAt: ValidDate };
type Opening = { status: 'OPENING'; submittedAt: ValidDate };
type Filled = {
  status: 'FILLED';
  fee: number;
  submittedAt: ValidDate;
  filledPrice: Price;
  filledAt: ValidDate;
};
type Canceled = { status: 'CANCELED'; submittedAt: ValidDate; canceledAt: ValidDate };
type Rejected = { status: 'REJECTED'; submittedAt: ValidDate; reason: string };

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
  return (request: { quantity?: number } | { quoteQuantity?: number }): void => {
    const { symbol, currency, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            currency,
            isEntry: true,
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
    const { symbol, currency, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            currency,
            isEntry: true,
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
    const { symbol, currency, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            currency,
            isEntry: true,
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
    const { symbol, currency, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            currency,
            isEntry: true,
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
  return (request: { quantity?: number } | { quoteQuantity?: number }): void => {
    const { symbol, currency, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            currency,
            isEntry: false,
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
    const { symbol, currency, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            currency,
            isEntry: false,
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
    const { symbol, currency, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            currency,
            isEntry: false,
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
    const { symbol, currency, timezone } = strategy;

    return pipe(
      io.Do,
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => pipe(deps.dateService.getCurrentDate, io.map(utcToZonedTime(timezone)))),
      io.map(
        ({ id, createdAt }) =>
          ({
            id,
            symbol,
            currency,
            isEntry: false,
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
      side = ['ENTRY', 'EXIT', 'CANCEL'],
      status = 'ALL',
    }: {
      side?: readonly ('ENTRY' | 'EXIT' | 'CANCEL')[];
      status?: 'PENDING' | 'OPENING' | 'ALL';
    } = { side: ['ENTRY', 'EXIT', 'CANCEL'], status: 'ALL' },
  ) => {
    const cancelFilter = [
      side.includes('ENTRY') ? propSatisfies(equals(true), 'isEntry') : undefined,
      side.includes('EXIT') ? propSatisfies(equals(false), 'isEntry') : undefined,
      side.includes('CANCEL') ? propSatisfies(equals('CANCEL'), 'type') : undefined,
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
                pendingOrdersRef.modify(flow(concat(cancelOrders), uniqWith(removeDuplicateCancelOrder))),
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
