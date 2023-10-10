import { Decimal } from 'decimal.js';
import { nanoid } from 'nanoid';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { ValidDate } from '#shared/utils/date.js';
import { nonEmptyStringSchema } from '#shared/utils/string.js';
import { Unbrand } from '#shared/utils/types.js';

import type { Price } from './kline.js';
import type { MakerFeeRate, TakerFeeRate } from './strategy.js';
import type { AssetName } from './symbol.js';

export type Order = MarketOrder | LimitOrder | StopMarketOrder | StopLimitOrder | CancelOrder;

type MarketOrder = DeepReadonly<BaseOrder & Market & (Pending | Filled | Rejected)>;
type LimitOrder = DeepReadonly<BaseOrder & Limit & (Pending | Opening | Filled | Canceled | Rejected)>;
type StopMarketOrder = DeepReadonly<
  BaseOrder & StopMarket & (Pending | Opening | Filled | Canceled | Rejected)
>;
type StopLimitOrder = DeepReadonly<
  BaseOrder & StopLimit & (Pending | Opening | Triggered | Filled | Canceled | Rejected)
>;
type CancelOrder = DeepReadonly<CancelBaseOrder & Cancel & (Pending | Submitted | Rejected)>;

export type PendingOrderRequest = DeepReadonly<
  | (BaseOrder & Unbrand<Market | Limit | StopMarket | StopLimit> & Pending)
  | (CancelBaseOrder & Cancel & Pending)
>;
export type PendingOrder = DeepReadonly<
  (BaseOrder & (Market | Limit | StopMarket | StopLimit) & Pending) | (CancelBaseOrder & Cancel & Pending)
>;
export type SubmittedOrder = DeepReadonly<CancelBaseOrder & Cancel & Submitted>;
export type OpeningOrder = DeepReadonly<BaseOrder & (Limit | StopMarket | StopLimit) & Opening>;
export type TriggeredOrder = DeepReadonly<BaseOrder & StopLimitOrder & Triggered>;
export type FilledOrder = DeepReadonly<BaseOrder & (Market | Limit | StopMarket | StopLimit) & Filled>;
export type CanceledOrder = DeepReadonly<BaseOrder & (Limit | StopMarket | StopLimit) & Canceled>;
export type RejectedOrder = DeepReadonly<
  | (BaseOrder & Unbrand<Market | Limit | StopMarket | StopLimit> & Rejected)
  | (CancelBaseOrder & Cancel & Rejected)
>;

type BaseOrder = { id: OrderId; createdAt: ValidDate } & (Entry | Exit);
type CancelBaseOrder = { id: OrderId; createdAt: ValidDate };

export type OrderId = z.infer<typeof orderIdSchema>;
const orderIdSchema = nonEmptyStringSchema.brand('OrderId');

export type OrderType = z.infer<typeof orderTypeSchema>;
export const orderTypeSchema = z.enum(['MARKET', 'LIMIT', 'STOP_MARKET', 'STOP_LIMIT', 'CANCEL']);
export const orderTypesList = orderTypeSchema.options;
export type OrderSide = z.infer<typeof orderSideSchema>;
export const orderSideSchema = z.enum(['ENTRY', 'EXIT']);

type Entry = { orderSide: 'ENTRY' };
type Exit = { orderSide: 'EXIT' };

type Market = { type: 'MARKET'; quantity: OrderQuantity };
type Limit = { type: 'LIMIT'; quantity: OrderQuantity; limitPrice: OrderPrice };
type StopMarket = { type: 'STOP_MARKET'; quantity: OrderQuantity; stopPrice: OrderPrice };
type StopLimit = {
  type: 'STOP_LIMIT';
  quantity: OrderQuantity;
  stopPrice: OrderPrice;
  limitPrice: OrderPrice;
};
type Cancel = { type: 'CANCEL'; orderIdToCancel: OrderId };

type Pending = { status: 'PENDING' };
type Submitted = { status: 'SUBMITTED'; submittedAt: ValidDate };
type Opening = { status: 'OPENING'; submittedAt: ValidDate };
type Triggered = { status: 'TRIGGERED'; submittedAt: ValidDate };
type Filled = { status: 'FILLED'; filledPrice: Price; fee: Fee; submittedAt: ValidDate; filledAt: ValidDate };
type Canceled = { status: 'CANCELED'; submittedAt: ValidDate; canceledAt: ValidDate };
type Rejected = { status: 'REJECTED'; submittedAt: ValidDate; reason: string };

export type OrderQuantity = z.infer<typeof orderQuantitySchema>;
const orderQuantitySchema = z.number().positive().brand('OrderQuantity');
export type OrderPrice = z.infer<typeof orderPriceSchema>;
const orderPriceSchema = z.number().positive().brand('OrderPrice');
export type Fee = Readonly<{ amount: FeeAmount; currency: AssetName }>;
export type FeeAmount = z.infer<typeof feeAmountSchema>;
const feeAmountSchema = z.number().nonnegative().brand('FeeAmount');

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
  const { type, quantity } = order;
  const { takerFeeRate, makerFeeRate } = feeRates;
  const { capitalCurrency, assetCurrency } = currencies;

  const feeCurrency = order.orderSide === 'ENTRY' ? assetCurrency : capitalCurrency;
  const feeRate =
    type === 'MARKET' ||
    type === 'STOP_MARKET' ||
    (type === 'LIMIT' && shouldTreatLimitOrderAsMarketOrder(order, filledPrice))
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
