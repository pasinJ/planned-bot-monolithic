import { Decimal } from 'decimal.js';
import { nanoid } from 'nanoid';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import type {
  Cancel,
  CanceledOrder,
  Fee,
  FeeAmount,
  FilledOrder,
  Limit,
  LimitOrder,
  Market,
  OpeningOrder,
  OrderId,
  OrderSide,
  PendingOrder,
  PendingOrderRequest,
  RejectedOrder,
  StopLimit,
  StopMarket,
  SubmittedOrder,
  TriggeredOrder,
} from '#SECT/Order.js';
import { ValidDate } from '#shared/utils/date.js';
import { Unbrand } from '#shared/utils/types.js';

import type { Price } from './kline.js';
import type { MakerFeeRate, TakerFeeRate } from './strategy.js';
import type { AssetName } from './symbol.js';

export type {
  Order,
  PendingOrderRequest,
  PendingOrder,
  SubmittedOrder,
  OpeningOrder,
  TriggeredOrder,
  FilledOrder,
  CanceledOrder,
  RejectedOrder,
  OrderId,
  OrderType,
  OrderSide,
  OrderQuantity,
  OrderPrice,
  Fee,
  FeeAmount,
} from '#SECT/Order.js';

export const orderTypeSchema = z.enum(['MARKET', 'LIMIT', 'STOP_MARKET', 'STOP_LIMIT', 'CANCEL']);
export const orderTypesList = orderTypeSchema.options;

export const orderSideSchema = z.enum(['ENTRY', 'EXIT']);

export function generateOrderId(): OrderId {
  return nanoid() as OrderId;
}

export function createPendingOrderRequest(
  request: DeepReadonly<
    ({ orderSide: OrderSide } & Unbrand<Market | Limit | StopMarket | StopLimit>) | Cancel
  >,
  orderId: OrderId,
  currentDate: ValidDate,
): PendingOrderRequest {
  return { ...request, id: orderId, status: 'PENDING', createdAt: currentDate };
}

export function createSubmittedOrder(
  order: Extract<PendingOrder, { type: 'CANCEL' }>,
  currentDate: ValidDate,
): SubmittedOrder {
  return { ...order, status: 'SUBMITTED', submittedAt: currentDate };
}

export function createOpeningOrder(
  order: Extract<PendingOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  currentDate: ValidDate,
): OpeningOrder {
  return { ...order, status: 'OPENING', submittedAt: currentDate };
}

export function createTriggeredOrder(
  openingOrder: Extract<OpeningOrder, { type: 'STOP_LIMIT' }>,
): TriggeredOrder {
  return { ...openingOrder, status: 'TRIGGERED' };
}

export function createFilledOrder<
  O extends Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' }> | OpeningOrder | TriggeredOrder,
>(
  order: O,
  currentDate: ValidDate,
  filledPrice: Price,
  feeRates: { takerFeeRate: TakerFeeRate; makerFeeRate: MakerFeeRate },
  currencies: { capitalCurrency: AssetName; assetCurrency: AssetName },
): Extract<FilledOrder, Pick<O, 'type' | 'orderSide'>> {
  return {
    submittedAt: currentDate,
    ...order,
    status: 'FILLED',
    filledPrice,
    fee: calculateFee(order, filledPrice, feeRates, currencies),
    filledAt: currentDate,
  };
}

export function createCanceledOrder(
  order: Extract<OpeningOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }> | TriggeredOrder,
  currentDate: ValidDate,
): CanceledOrder {
  return { ...order, status: 'CANCELED', canceledAt: currentDate };
}

export function createRejectedOrder(
  order: PendingOrderRequest,
  reason: string,
  currentDate: ValidDate,
): RejectedOrder {
  return { submittedAt: currentDate, ...order, status: 'REJECTED', reason };
}

export function calculateFee(
  order: Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' }> | OpeningOrder | TriggeredOrder,
  filledPrice: Price,
  feeRates: { takerFeeRate: TakerFeeRate; makerFeeRate: MakerFeeRate },
  currencies: { capitalCurrency: AssetName; assetCurrency: AssetName },
): Fee {
  const { type, quantity, status } = order;
  const { takerFeeRate, makerFeeRate } = feeRates;
  const { capitalCurrency, assetCurrency } = currencies;

  const feeCurrency = order.orderSide === 'ENTRY' ? assetCurrency : capitalCurrency;
  const feeRate =
    (status === 'PENDING' && type === 'LIMIT' && shouldTreatLimitOrderAsMarketOrder(order, filledPrice)) ||
    type === 'MARKET' ||
    type === 'STOP_MARKET'
      ? takerFeeRate
      : makerFeeRate;
  const amountToReceive =
    order.orderSide === 'ENTRY' ? new Decimal(quantity) : new Decimal(quantity).times(filledPrice);
  const feeAmount = amountToReceive
    .times(feeRate)
    .dividedBy(100)
    .toDecimalPlaces(8, Decimal.ROUND_HALF_UP)
    .toNumber() as FeeAmount;

  return { amount: feeAmount, currency: feeCurrency };
}

export function shouldTreatLimitOrderAsMarketOrder(
  limitOrder: Extract<PendingOrderRequest, { type: 'LIMIT' }> | LimitOrder,
  marketPrice: Price,
): boolean {
  return (
    (limitOrder.orderSide === 'ENTRY' && limitOrder.limitPrice >= marketPrice) ||
    (limitOrder.orderSide === 'EXIT' && limitOrder.limitPrice <= marketPrice)
  );
}
