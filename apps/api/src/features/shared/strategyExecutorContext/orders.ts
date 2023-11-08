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
  find,
  isEmpty,
  isNotNil,
  prop,
  propEq,
  propSatisfies,
  reject,
  uniqWith,
} from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import type { OrdersModule } from '#SECT/OrdersModule.js';
import { DateService } from '#infra/services/date/service.js';
import { executeIo } from '#shared/utils/fp.js';
import { isUndefined } from '#shared/utils/general.js';

import { LotSizeFilter, MarketLotSizeFilter } from '../bnbSymbol.js';
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

export type { OrdersModule } from '#SECT/OrdersModule.js';

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
    cancelOrder: cancelOrder(deps, pendingOrderRequestsRef, openingOrders, triggeredOrders),
    cancelAllOrders: cancelAllOrders(deps, pendingOrderRequestsRef, openingOrders, triggeredOrders),
    getPendingOrders: () => pendingOrderRequestsRef.read(),
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
  return (request: {
    quantity: number;
  }): Extract<PendingOrderRequest, { type: 'MARKET'; orderSide: 'ENTRY' }> =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundMarketQuantity(request.quantity, symbol)),
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => deps.dateService.getCurrentDate),
      io.map(({ id, createdAt, roundedQuantity }) =>
        createPendingOrderRequest(
          { orderSide: 'ENTRY', type: 'MARKET', quantity: roundedQuantity },
          id,
          createdAt,
        ),
      ),
      io.chainFirst((order) => pendingOrderRequestsRef.modify(append(order))),
      io.map((order) => order as Extract<PendingOrderRequest, { type: 'MARKET'; orderSide: 'ENTRY' }>),
      executeIo,
    );
}

function enterLimit(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: {
    quantity: number;
    limitPrice: number;
  }): Extract<PendingOrderRequest, { type: 'LIMIT'; orderSide: 'ENTRY' }> =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundQuantity(request.quantity, symbol)),
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
      io.chainFirst((order) => pendingOrderRequestsRef.modify(append(order))),
      io.map((order) => order as Extract<PendingOrderRequest, { type: 'LIMIT'; orderSide: 'ENTRY' }>),
      executeIo,
    );
}

function enterStopMarket(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: {
    quantity: number;
    stopPrice: number;
  }): Extract<PendingOrderRequest, { type: 'STOP_MARKET'; orderSide: 'ENTRY' }> =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundQuantity(request.quantity, symbol)),
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
      io.chainFirst((order) => pendingOrderRequestsRef.modify(append(order))),
      io.map((order) => order as Extract<PendingOrderRequest, { type: 'STOP_MARKET'; orderSide: 'ENTRY' }>),
      executeIo,
    );
}

function enterStopLimit(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: {
    quantity: number;
    stopPrice: number;
    limitPrice: number;
  }): Extract<PendingOrderRequest, { type: 'STOP_LIMIT'; orderSide: 'ENTRY' }> =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundQuantity(request.quantity, symbol)),
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
      io.chainFirst((order) => pendingOrderRequestsRef.modify(append(order))),
      io.map((order) => order as Extract<PendingOrderRequest, { type: 'STOP_LIMIT'; orderSide: 'ENTRY' }>),
      executeIo,
    );
}

function exitMarket(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: {
    quantity: number;
  }): Extract<PendingOrderRequest, { type: 'MARKET'; orderSide: 'EXIT' }> =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundMarketQuantity(request.quantity, symbol)),
      io.bind('id', () => deps.generateOrderId),
      io.bind('createdAt', () => deps.dateService.getCurrentDate),
      io.map(({ id, createdAt, roundedQuantity }) =>
        createPendingOrderRequest(
          { orderSide: 'EXIT', type: 'MARKET', quantity: roundedQuantity },
          id,
          createdAt,
        ),
      ),
      io.chainFirst((order) => pendingOrderRequestsRef.modify(append(order))),
      io.map((order) => order as Extract<PendingOrderRequest, { type: 'MARKET'; orderSide: 'EXIT' }>),
      executeIo,
    );
}

function exitLimit(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: {
    quantity: number;
    limitPrice: number;
  }): Extract<PendingOrderRequest, { type: 'LIMIT'; orderSide: 'EXIT' }> =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundQuantity(request.quantity, symbol)),
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
      io.chainFirst((order) => pendingOrderRequestsRef.modify(append(order))),
      io.map((order) => order as Extract<PendingOrderRequest, { type: 'LIMIT'; orderSide: 'EXIT' }>),
      executeIo,
    );
}

function exitStopMarket(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: {
    quantity: number;
    stopPrice: number;
  }): Extract<PendingOrderRequest, { type: 'STOP_MARKET'; orderSide: 'EXIT' }> =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundQuantity(request.quantity, symbol)),
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
      io.chainFirst((order) => pendingOrderRequestsRef.modify(append(order))),
      io.map((order) => order as Extract<PendingOrderRequest, { type: 'STOP_MARKET'; orderSide: 'EXIT' }>),
      executeIo,
    );
}

function exitStopLimit(
  deps: OrdersModuleDeps,
  symbol: Symbol,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
) {
  return (request: {
    quantity: number;
    stopPrice: number;
    limitPrice: number;
  }): Extract<PendingOrderRequest, { type: 'STOP_LIMIT'; orderSide: 'EXIT' }> =>
    pipe(
      io.Do,
      io.let('roundedQuantity', () => roundQuantity(request.quantity, symbol)),
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
      io.chainFirst((order) => pendingOrderRequestsRef.modify(append(order))),
      io.map((order) => order as Extract<PendingOrderRequest, { type: 'STOP_LIMIT'; orderSide: 'EXIT' }>),
      executeIo,
    );
}

function cancelOrder(
  deps: OrdersModuleDeps,
  pendingOrderRequestsRef: ior.IORef<readonly PendingOrderRequest[]>,
  openingOrders: readonly OpeningOrder[],
  triggeredOrders: readonly TriggeredOrder[],
) {
  return (orderIdToCancel: OrderId): void =>
    pipe(
      concat<OpeningOrder | TriggeredOrder, TriggeredOrder>(openingOrders, triggeredOrders),
      find(propEq(orderIdToCancel, 'id')),
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
  triggeredOrders: readonly TriggeredOrder[],
) {
  return (
    {
      type = ['ENTRY', 'EXIT', 'CANCEL'],
      status = 'ALL',
    }: {
      type?: readonly ('ENTRY' | 'EXIT' | 'CANCEL')[];
      status?: 'PENDING' | 'OPENING' | 'TRIGGERED' | 'ALL';
    } = { type: ['ENTRY', 'EXIT', 'CANCEL'], status: 'ALL' },
  ): void => {
    const openingAndTriggeredOrders = concat<OpeningOrder | TriggeredOrder, TriggeredOrder>(
      openingOrders,
      triggeredOrders,
    );
    const cancelFilter = [
      type.includes('ENTRY') ? propSatisfies(equals('ENTRY'), 'orderSide') : undefined,
      type.includes('EXIT') ? propSatisfies(equals('EXIT'), 'orderSide') : undefined,
      type.includes('CANCEL') ? propSatisfies(equals('CANCEL'), 'type') : undefined,
    ].filter(isNotNil);
    const orderIdsToCancel =
      status === 'PENDING'
        ? []
        : status === 'OPENING'
        ? filter(anyPass(cancelFilter), openingOrders).map(prop('id'))
        : status === 'TRIGGERED'
        ? filter(anyPass(cancelFilter), triggeredOrders).map(prop('id'))
        : filter(anyPass(cancelFilter), openingAndTriggeredOrders).map(prop('id'));

    return pipe(
      status === 'PENDING' || status === 'ALL'
        ? pendingOrderRequestsRef.modify(reject(anyPass(cancelFilter)))
        : io.of(undefined),
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

function roundMarketQuantity(quantity: number, symbol: Symbol): number {
  const marketLotSizeFilter = symbol.filters.find(propEq('MARKET_LOT_SIZE', 'type')) as
    | MarketLotSizeFilter
    | undefined;

  let roundedQuantity = new Decimal(quantity);

  if (marketLotSizeFilter) {
    roundedQuantity = roundedQuantity.clampedTo(marketLotSizeFilter.minQty, marketLotSizeFilter.maxQty);
  }
  if (marketLotSizeFilter && marketLotSizeFilter.stepSize !== 0) {
    roundedQuantity = roundedQuantity.toNearest(marketLotSizeFilter.stepSize, Decimal.ROUND_DOWN);
  }

  return roundQuantity(roundedQuantity, symbol);
}
function roundQuantity(quantity: number | Decimal, symbol: Symbol): number {
  const lotSizeFilter = symbol.filters.find(propEq('LOT_SIZE', 'type')) as LotSizeFilter | undefined;

  let roundedQuantity = new Decimal(quantity);

  if (lotSizeFilter) {
    roundedQuantity = roundedQuantity.clampedTo(lotSizeFilter.minQty, lotSizeFilter.maxQty);
  }
  if (lotSizeFilter && lotSizeFilter.stepSize !== 0) {
    roundedQuantity = roundedQuantity.toNearest(lotSizeFilter.stepSize, Decimal.ROUND_DOWN);
  }

  return roundedQuantity
    .toDecimalPlaces(symbol.baseAssetPrecision as number, Decimal.ROUND_HALF_UP)
    .toNumber();
}
