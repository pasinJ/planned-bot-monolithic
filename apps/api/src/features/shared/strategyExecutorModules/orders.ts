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

import { DateService } from '#infra/services/date/service.js';
import { executeIo } from '#shared/utils/fp.js';
import { isUndefined } from '#shared/utils/general.js';

import {
  CanceledOrder,
  FilledOrder,
  OpeningOrder,
  OrderId,
  PendingOrder,
  PendingOrderRequest,
  RejectedOrder,
  SubmittedOrder,
  TriggeredOrder,
  createPendingOrderRequest,
} from '../order.js';
import { Symbol, roundAsset } from '../symbol.js';

export type OrdersModule = DeepReadonly<{
  /**   Enter a trading position with a market order (Taker)
   * A market order is an instruction to buy immediately (at the market’s current price).
   * @param request <br/>
   *    - 'quantity' specifies the amount of the base asset the user wants to buy at the market price.
   * @returns void
   */
  enterMarket: (request: { quantity: number }) => void;
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
  exitMarket: (request: { quantity: number }) => void;
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
  getPendingOrders: () => readonly PendingOrderRequest[];
  getSubmittedOrders: () => readonly SubmittedOrder[];
  getOpeningOrders: () => readonly OpeningOrder[];
  getTriggeredOrders: () => readonly TriggeredOrder[];
  getFilledOrders: () => readonly FilledOrder[];
  getCanceledOrders: () => readonly CanceledOrder[];
  getRejectedOrders: () => readonly RejectedOrder[];
}>;

export type OrdersModuleDeps = DeepReadonly<{
  dateService: DateService;
  generateOrderId: io.IO<OrderId>;
}>;
export function buildOrdersModule(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  orders: {
    openingOrders: readonly OpeningOrder[];
    submittedOrders: readonly SubmittedOrder[];
    triggeredOrders: readonly TriggeredOrder[];
    filledOrders: readonly FilledOrder[];
    canceledOrders: readonly CanceledOrder[];
    rejectedOrders: readonly RejectedOrder[];
  },
): OrdersModule {
  const { openingOrders, submittedOrders, triggeredOrders, filledOrders, canceledOrders, rejectedOrders } =
    orders;
  const pendingOrderRequestsRef = new ior.IORef([] as readonly PendingOrderRequest[]);

  return {
    enterMarket: enterMarket(deps, symbol, pendingOrderRequestsRef),
    enterLimit: enterLimit(deps, symbol, pendingOrderRequestsRef),
    enterStopMarket: enterStopMarket(deps, symbol, pendingOrderRequestsRef),
    enterStopLimit: enterStopLimit(deps, symbol, pendingOrderRequestsRef),
    exitMarket: exitMarket(deps, symbol, pendingOrderRequestsRef),
    exitLimit: exitLimit(deps, symbol, pendingOrderRequestsRef),
    exitStopMarket: exitStopMarket(deps, symbol, pendingOrderRequestsRef),
    exitStopLimit: exitStopLimit(deps, symbol, pendingOrderRequestsRef),
    cancelOrder: cancelOrder(deps, pendingOrderRequestsRef, openingOrders),
    cancelAllOrders: cancelAllOrders(deps, pendingOrderRequestsRef, openingOrders),
    getPendingOrders: pendingOrderRequestsRef.read,
    getSubmittedOrders: () => submittedOrders,
    getOpeningOrders: () => openingOrders,
    getTriggeredOrders: () => triggeredOrders,
    getFilledOrders: () => filledOrders,
    getCanceledOrders: () => canceledOrders,
    getRejectedOrders: () => rejectedOrders,
  };
}

function enterMarket(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: { quantity: number }): void =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundAsset(request.quantity, symbol.baseAssetPrecision)),
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => deps.dateService.getCurrentDate),
      io.map(({ id, createdAt, roundedQuantity }) =>
        createPendingOrderRequest(
          { orderSide: 'ENTRY', type: 'MARKET', quantity: roundedQuantity },
          id,
          createdAt,
        ),
      ),
      io.chain((order) => pendingOrderRequestsRef.modify(append(order))),
      executeIo,
    );
}

function enterLimit(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: { quantity: number; limitPrice: number }): void =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundAsset(request.quantity, symbol.baseAssetPrecision)),
      io.let('roundedLimitPrice', () => roundAsset(request.limitPrice, symbol.quoteAssetPrecision)),
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => deps.dateService.getCurrentDate),
      io.map(({ id, createdAt, roundedQuantity, roundedLimitPrice }) =>
        createPendingOrderRequest(
          { orderSide: 'ENTRY', type: 'LIMIT', quantity: roundedQuantity, limitPrice: roundedLimitPrice },
          id,
          createdAt,
        ),
      ),
      io.chain((order) => pendingOrderRequestsRef.modify(append(order))),
      executeIo,
    );
}

function enterStopMarket(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: { quantity: number; stopPrice: number }): void =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundAsset(request.quantity, symbol.baseAssetPrecision)),
      io.let('roundedStopPrice', () => roundAsset(request.stopPrice, symbol.quoteAssetPrecision)),
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => deps.dateService.getCurrentDate),
      io.map(({ id, createdAt, roundedQuantity, roundedStopPrice }) =>
        createPendingOrderRequest(
          { orderSide: 'ENTRY', type: 'STOP_MARKET', quantity: roundedQuantity, stopPrice: roundedStopPrice },
          id,
          createdAt,
        ),
      ),
      io.chain((order) => pendingOrderRequestsRef.modify(append(order))),
      executeIo,
    );
}

function enterStopLimit(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: { quantity: number; stopPrice: number; limitPrice: number }): void =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundAsset(request.quantity, symbol.baseAssetPrecision)),
      io.let('roundedStopPrice', () => roundAsset(request.stopPrice, symbol.quoteAssetPrecision)),
      io.let('roundedLimitPrice', () => roundAsset(request.limitPrice, symbol.quoteAssetPrecision)),
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => deps.dateService.getCurrentDate),
      io.map(({ id, createdAt, roundedQuantity, roundedStopPrice, roundedLimitPrice }) =>
        createPendingOrderRequest(
          {
            orderSide: 'ENTRY',
            type: 'STOP_LIMIT',
            quantity: roundedQuantity,
            stopPrice: roundedStopPrice,
            limitPrice: roundedLimitPrice,
          },
          id,
          createdAt,
        ),
      ),
      io.chain((order) => pendingOrderRequestsRef.modify(append(order))),
      executeIo,
    );
}

function exitMarket(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: { quantity: number }): void =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundAsset(request.quantity, symbol.baseAssetPrecision)),
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => deps.dateService.getCurrentDate),
      io.map(({ id, createdAt, roundedQuantity }) =>
        createPendingOrderRequest(
          { orderSide: 'EXIT', type: 'MARKET', quantity: roundedQuantity },
          id,
          createdAt,
        ),
      ),
      io.chain((order) => pendingOrderRequestsRef.modify(append(order))),
      executeIo,
    );
}

function exitLimit(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: { quantity: number; limitPrice: number }): void =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundAsset(request.quantity, symbol.baseAssetPrecision)),
      io.let('roundedLimitPrice', () => roundAsset(request.limitPrice, symbol.quoteAssetPrecision)),
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => deps.dateService.getCurrentDate),
      io.map(({ id, createdAt, roundedQuantity, roundedLimitPrice }) =>
        createPendingOrderRequest(
          { orderSide: 'EXIT', type: 'LIMIT', quantity: roundedQuantity, limitPrice: roundedLimitPrice },
          id,
          createdAt,
        ),
      ),
      io.chain((order) => pendingOrderRequestsRef.modify(append(order))),
      executeIo,
    );
}

function exitStopMarket(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: { quantity: number; stopPrice: number }): void =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundAsset(request.quantity, symbol.baseAssetPrecision)),
      io.let('roundedStopPrice', () => roundAsset(request.stopPrice, symbol.quoteAssetPrecision)),
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => deps.dateService.getCurrentDate),
      io.map(({ id, createdAt, roundedQuantity, roundedStopPrice }) =>
        createPendingOrderRequest(
          { orderSide: 'EXIT', type: 'STOP_MARKET', quantity: roundedQuantity, stopPrice: roundedStopPrice },
          id,
          createdAt,
        ),
      ),
      io.chain((order) => pendingOrderRequestsRef.modify(append(order))),
      executeIo,
    );
}

function exitStopLimit(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: { quantity: number; stopPrice: number; limitPrice: number }): void =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundAsset(request.quantity, symbol.baseAssetPrecision)),
      io.let('roundedStopPrice', () => roundAsset(request.stopPrice, symbol.quoteAssetPrecision)),
      io.let('roundedLimitPrice', () => roundAsset(request.limitPrice, symbol.quoteAssetPrecision)),
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => deps.dateService.getCurrentDate),
      io.map(({ id, createdAt, roundedQuantity, roundedStopPrice, roundedLimitPrice }) =>
        createPendingOrderRequest(
          {
            orderSide: 'EXIT',
            type: 'STOP_LIMIT',
            quantity: roundedQuantity,
            stopPrice: roundedStopPrice,
            limitPrice: roundedLimitPrice,
          },
          id,
          createdAt,
        ),
      ),
      io.chain((order) => pendingOrderRequestsRef.modify(append(order))),
      executeIo,
    );
}

function cancelOrder(
  deps: OrdersModuleDeps,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
  openingOrders: readonly OpeningOrder[],
) {
  return (orderIdToCancel: OrderId): void =>
    pipe(
      openingOrders.find(propEq(orderIdToCancel, 'id')),
      (openingOrder) =>
        isUndefined(openingOrder)
          ? pendingOrderRequestsRef.modify(reject(propEq(orderIdToCancel, 'id')))
          : pipe(
              createCancelOrder(deps, orderIdToCancel),
              io.chain((cancelOrder) =>
                pendingOrderRequestsRef.modify((pendingOrders) => {
                  const newPendingOrders = append(cancelOrder, pendingOrders);
                  return uniqWith(removeDuplicateCancelOrder, newPendingOrders);
                }),
              ),
            ),
      executeIo,
    );
}

function cancelAllOrders(
  deps: OrdersModuleDeps,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
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
  ): void => {
    const cancelFilter = [
      type.includes('ENTRY') ? propSatisfies(equals('ENTRY'), 'orderSide') : undefined,
      type.includes('EXIT') ? propSatisfies(equals('EXIT'), 'orderSide') : undefined,
      type.includes('CANCEL') ? propSatisfies(equals('CANCEL'), 'type') : undefined,
    ].filter(isNotNil);
    const orderIdsToCancel =
      status === 'PENDING' ? [] : filter(anyPass(cancelFilter), openingOrders).map(prop('id'));

    return pipe(
      status !== 'OPENING' ? pendingOrderRequestsRef.modify(reject(anyPass(cancelFilter))) : io.of(undefined),
      io.chain(() =>
        !isEmpty(orderIdsToCancel)
          ? pipe(
              orderIdsToCancel.map((orderId) => createCancelOrder(deps, orderId)),
              io.sequenceArray,
              io.chain((cancelOrders) =>
                pendingOrderRequestsRef.modify(
                  flow(concat(__, cancelOrders), uniqWith(removeDuplicateCancelOrder)),
                ),
              ),
            )
          : io.of(undefined),
      ),
      executeIo,
    );
  };
}

function createCancelOrder(
  deps: OrdersModuleDeps,
  orderIdToCancel: OrderId,
): io.IO<Extract<PendingOrder, { type: 'CANCEL' }>> {
  return pipe(
    io.Do,
    io.bind('id', () => deps.generateOrderId),
    io.bind('createdAt', () => deps.dateService.getCurrentDate),
    io.map(
      ({ id, createdAt }) =>
        createPendingOrderRequest({ type: 'CANCEL', orderIdToCancel }, id, createdAt) as Extract<
          PendingOrder,
          { type: 'CANCEL' }
        >,
    ),
  );
}

function removeDuplicateCancelOrder(x: PendingOrderRequest, y: PendingOrderRequest): boolean {
  return x.type === 'CANCEL' && y.type === 'CANCEL' && x.orderIdToCancel === y.orderIdToCancel ? true : false;
}
