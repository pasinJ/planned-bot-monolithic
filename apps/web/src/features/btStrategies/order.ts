import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { Price, priceSchema } from '#features/klines/kline';
import { BaseAsset, QuoteAsset, baseAssetSchema, quoteAssetschema } from '#features/symbols/symbol';
import { ValidDate, validDateSchema } from '#shared/utils/date';
import { schemaForType } from '#shared/utils/zod';

export type OrderId = string & z.BRAND<'OrderId'>;
export const orderIdSchema = schemaForType<OrderId>().with(z.string().brand('OrderId'));

export type OrderType = z.infer<typeof orderTypeSchema>;
export const orderTypeSchema = z.enum(['MARKET', 'LIMIT', 'STOP_MARKET', 'STOP_LIMIT', 'CANCEL']);
export const orderTypeEnum = orderTypeSchema.enum;
export const orderTypeOptions = orderTypeSchema.options;

export type OrderSide = z.infer<typeof orderSideSchema>;
export const orderSideSchema = z.enum(['ENTRY', 'EXIT']);
export const orderSideEnum = orderSideSchema.enum;
export const orderSideOptions = orderSideSchema.options;

export type OrderStatus = z.infer<typeof orderSideSchema>;
export const orderStatusSchema = z.enum([
  'PENDING',
  'SUBMITTED',
  'OPENING',
  'TRIGGERED',
  'FILLED',
  'CANCELED',
  'REJECTED',
]);
export const orderStatusEnum = orderStatusSchema.enum;
export const orderStatusOptions = orderStatusSchema.options;

export type OrderQuantity = number & z.BRAND<'OrderQuantity'>;
export const orderQuantitySchema = schemaForType<OrderQuantity>().with(z.number().brand('OrderQuantity'));

export type OrderPrice = number & z.BRAND<'OrderPrice'>;
export const orderPriceSchema = schemaForType<OrderPrice>().with(z.number().brand('OrderPrice'));

export type FeeAmount = number & z.BRAND<'FeeAmount'>;
export const feeAmountSchema = schemaForType<FeeAmount>().with(z.number().brand('FeeAmount'));
export type Fee = Readonly<{ amount: FeeAmount; currency: BaseAsset | QuoteAsset }>;
export const feeSchema = schemaForType<Fee>().with(
  z.object({ amount: feeAmountSchema, currency: z.union([baseAssetSchema, quoteAssetschema]) }).readonly(),
);

export type BaseOrder = { id: OrderId; quantity: OrderQuantity; createdAt: ValidDate } & (Entry | Exit);

export type Entry = { orderSide: 'ENTRY' };
export type Exit = { orderSide: 'EXIT' };

export type Market = { type: 'MARKET' };
export type Limit = { type: 'LIMIT'; limitPrice: OrderPrice };
export type StopMarket = { type: 'STOP_MARKET'; stopPrice: OrderPrice };
export type StopLimit = { type: 'STOP_LIMIT'; stopPrice: OrderPrice; limitPrice: OrderPrice };
export type Cancel = { id: OrderId; type: 'CANCEL'; orderIdToCancel: OrderId; createdAt: ValidDate };

export type Pending = { status: 'PENDING' };
export type Submitted = { status: 'SUBMITTED'; submittedAt: ValidDate };
export type Opening = { status: 'OPENING'; submittedAt: ValidDate };
export type Triggered = { status: 'TRIGGERED'; submittedAt: ValidDate };
export type Filled = {
  status: 'FILLED';
  filledPrice: Price;
  fee: Fee;
  submittedAt: ValidDate;
  filledAt: ValidDate;
};
export type Canceled = { status: 'CANCELED'; submittedAt: ValidDate; canceledAt: ValidDate };
export type Rejected = { status: 'REJECTED'; submittedAt: ValidDate; reason: string };

export type SubmittedOrder = DeepReadonly<Cancel & Submitted>;
export const submittedOrderSchema = schemaForType<SubmittedOrder>().with(
  z
    .object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.CANCEL),
      orderIdToCancel: orderIdSchema,
      status: z.literal(orderStatusEnum.SUBMITTED),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
    })
    .readonly(),
);

export type OpeningOrder = DeepReadonly<BaseOrder & (Limit | StopMarket | StopLimit) & Opening>;
export const openingOrderSchema = schemaForType<OpeningOrder>().with(
  z.discriminatedUnion('type', [
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.LIMIT),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      limitPrice: orderPriceSchema,
      status: z.literal(orderStatusEnum.OPENING),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
    }),
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.STOP_MARKET),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      stopPrice: orderPriceSchema,
      status: z.literal(orderStatusEnum.OPENING),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
    }),
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.STOP_LIMIT),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      stopPrice: orderPriceSchema,
      limitPrice: orderPriceSchema,
      status: z.literal(orderStatusEnum.OPENING),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
    }),
  ]),
);

export type TriggeredOrder = DeepReadonly<BaseOrder & StopLimit & Triggered>;
export const triggeredOrderSchema = schemaForType<TriggeredOrder>().with(
  z.object({
    id: orderIdSchema,
    type: z.literal(orderTypeEnum.STOP_LIMIT),
    orderSide: orderSideSchema,
    quantity: orderQuantitySchema,
    stopPrice: orderPriceSchema,
    limitPrice: orderPriceSchema,
    status: z.literal(orderStatusEnum.TRIGGERED),
    createdAt: validDateSchema,
    submittedAt: validDateSchema,
  }),
);

export type FilledOrder = DeepReadonly<BaseOrder & (Market | Limit | StopMarket | StopLimit) & Filled>;
export const filledOrderSchema = schemaForType<FilledOrder>().with(
  z.discriminatedUnion('type', [
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.MARKET),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      filledPrice: priceSchema,
      fee: feeSchema,
      status: z.literal(orderStatusEnum.FILLED),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
      filledAt: validDateSchema,
    }),
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.LIMIT),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      limitPrice: orderPriceSchema,
      filledPrice: priceSchema,
      fee: feeSchema,
      status: z.literal(orderStatusEnum.FILLED),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
      filledAt: validDateSchema,
    }),
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.STOP_MARKET),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      stopPrice: orderPriceSchema,
      filledPrice: priceSchema,
      fee: feeSchema,
      status: z.literal(orderStatusEnum.FILLED),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
      filledAt: validDateSchema,
    }),
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.STOP_LIMIT),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      stopPrice: orderPriceSchema,
      limitPrice: orderPriceSchema,
      filledPrice: priceSchema,
      fee: feeSchema,
      status: z.literal(orderStatusEnum.FILLED),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
      filledAt: validDateSchema,
    }),
  ]),
);

export type CanceledOrder = DeepReadonly<BaseOrder & (Limit | StopMarket | StopLimit) & Canceled>;
export const canceledOrderSchema = schemaForType<CanceledOrder>().with(
  z.discriminatedUnion('type', [
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.LIMIT),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      limitPrice: orderPriceSchema,
      status: z.literal(orderStatusEnum.CANCELED),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
      canceledAt: validDateSchema,
    }),
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.STOP_MARKET),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      stopPrice: orderPriceSchema,
      status: z.literal(orderStatusEnum.CANCELED),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
      canceledAt: validDateSchema,
    }),
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.STOP_LIMIT),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      stopPrice: orderPriceSchema,
      limitPrice: orderPriceSchema,
      status: z.literal(orderStatusEnum.CANCELED),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
      canceledAt: validDateSchema,
    }),
  ]),
);

export type RejectedOrder = DeepReadonly<
  (BaseOrder & (Market | Limit | StopMarket | StopLimit) & Rejected) | (Cancel & Rejected)
>;
export const rejectedOrderSchema = schemaForType<RejectedOrder>().with(
  z.discriminatedUnion('type', [
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.LIMIT),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      limitPrice: orderPriceSchema,
      status: z.literal(orderStatusEnum.REJECTED),
      reason: z.string(),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
    }),
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.STOP_MARKET),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      stopPrice: orderPriceSchema,
      status: z.literal(orderStatusEnum.REJECTED),
      reason: z.string(),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
    }),
    z.object({
      id: orderIdSchema,
      type: z.literal(orderTypeEnum.STOP_LIMIT),
      orderSide: orderSideSchema,
      quantity: orderQuantitySchema,
      stopPrice: orderPriceSchema,
      limitPrice: orderPriceSchema,
      status: z.literal(orderStatusEnum.REJECTED),
      reason: z.string(),
      createdAt: validDateSchema,
      submittedAt: validDateSchema,
    }),
  ]),
);

export type FilledEntryOrder = Extract<FilledOrder, { orderSide: 'ENTRY' }>;
export const filledEntryOrderSchema = z.custom<FilledEntryOrder>((value) => {
  const validateFilledOrder = filledOrderSchema.safeParse(value);
  return validateFilledOrder.success && validateFilledOrder.data.orderSide === 'ENTRY';
});
export type FilledExitOrder = Extract<FilledOrder, { orderSide: 'EXIT' }>;
export const filledExitOrderSchema = z.custom<FilledExitOrder>((value) => {
  const validateFilledOrder = filledOrderSchema.safeParse(value);
  return validateFilledOrder.success && validateFilledOrder.data.orderSide === 'EXIT';
});
