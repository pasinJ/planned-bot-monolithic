import { Decimal } from 'decimal.js';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { ValidDate } from '#shared/utils/date.js';
import { nonEmptyStringSchema } from '#shared/utils/string.js';

import type { Price } from './kline.js';
import type { MakerFeeRate, TakerFeeRate } from './strategy.js';
import type { AssetName } from './symbol.js';

export type Order = MarketOrder | LimitOrder | StopMarketOrder | StopLimitOrder | CancelOrder;

export type MarketOrder = DeepReadonly<BaseOrder & Market & (Pending | Filled | Rejected)>;
export type LimitOrder = DeepReadonly<BaseOrder & Limit & (Pending | Opening | Filled | Canceled | Rejected)>;
export type StopMarketOrder = DeepReadonly<
  BaseOrder & StopMarket & (Pending | Opening | Filled | Canceled | Rejected)
>;
export type StopLimitOrder = DeepReadonly<
  BaseOrder & StopLimit & (Pending | Opening | Triggered | Filled | Canceled | Rejected)
>;
export type CancelOrder = DeepReadonly<CancelBaseOrder & Cancel & (Pending | Submitted | Rejected)>;

export type PendingOrder = DeepReadonly<
  (BaseOrder & (Market | Limit | StopMarket | StopLimit) & Pending) | (CancelBaseOrder & Cancel & Pending)
>;
export type SubmittedOrder = DeepReadonly<CancelBaseOrder & Cancel & Submitted>;
export type OpeningOrder = DeepReadonly<BaseOrder & (Limit | StopMarket | StopLimit) & Opening>;
export type TriggeredOrder = DeepReadonly<BaseOrder & StopLimitOrder & Triggered>;
export type FilledOrder = DeepReadonly<BaseOrder & (Market | Limit | StopMarket | StopLimit) & Filled>;
export type CanceledOrder = DeepReadonly<BaseOrder & (Limit | StopMarket | StopLimit) & Canceled>;
export type RejectedOrder = DeepReadonly<
  (BaseOrder & (Market | Limit | StopMarket | StopLimit) & Rejected) | (CancelBaseOrder & Cancel & Rejected)
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

type Market = { type: 'MARKET'; quantity: number };
type Limit = { type: 'LIMIT'; quantity: number; limitPrice: number };
type StopMarket = { type: 'STOP_MARKET'; quantity: number; stopPrice: number };
type StopLimit = { type: 'STOP_LIMIT'; quantity: number; stopPrice: number; limitPrice: number };
type Cancel = { type: 'CANCEL'; orderIdToCancel: OrderId };

type Pending = { status: 'PENDING' };
type Submitted = { status: 'SUBMITTED'; submittedAt: ValidDate };
type Opening = { status: 'OPENING'; submittedAt: ValidDate };
type Triggered = { status: 'TRIGGERED'; submittedAt: ValidDate };
type Filled = { status: 'FILLED'; filledPrice: Price; fee: Fee; submittedAt: ValidDate; filledAt: ValidDate };
type Canceled = { status: 'CANCELED'; submittedAt: ValidDate; canceledAt: ValidDate };
type Rejected = { status: 'REJECTED'; submittedAt: ValidDate; reason: string };

export type Fee = Readonly<{ amount: FeeAmount; currency: AssetName }>;
export type FeeAmount = number & z.BRAND<'FeeAmount'>;

export function createPendingOrder(
  request: DeepReadonly<({ orderSide: OrderSide } & (Market | Limit | StopMarket | StopLimit)) | Cancel>,
  orderId: OrderId,
  currentDate: ValidDate,
): PendingOrder {
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

export function createFilledOrder(
  order: Extract<PendingOrder, { type: 'MARKET' | 'LIMIT' }> | OpeningOrder | TriggeredOrder,
  currentDate: ValidDate,
  filledPrice: Price,
  feeRates: { takerFeeRate: TakerFeeRate; makerFeeRate: MakerFeeRate },
  currencies: { capitalCurrency: AssetName; assetCurrency: AssetName },
): FilledOrder {
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
  order: Extract<OpeningOrder, { type: 'LIMIT' | 'STOP_MARKET' | 'STOP_LIMIT' }>,
  currentDate: ValidDate,
): CanceledOrder {
  return { ...order, status: 'CANCELED', canceledAt: currentDate };
}

export function createRejectedOrder(
  order: PendingOrder,
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
    .toNumber();

  return { amount: feeAmount, currency: feeCurrency } as Fee;
}

export function shouldTreatLimitOrderAsMarketOrder(limitOrder: LimitOrder, marketPrice: Price): boolean {
  return (
    (limitOrder.orderSide === 'ENTRY' && limitOrder.limitPrice >= marketPrice) ||
    (limitOrder.orderSide === 'EXIT' && limitOrder.limitPrice <= marketPrice)
  );
}
