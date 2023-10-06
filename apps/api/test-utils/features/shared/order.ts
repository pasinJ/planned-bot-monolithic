import { mergeDeepRight } from 'ramda';
import { DeepPartial, Exact } from 'ts-essentials';

import { Price } from '#features/shared/kline.js';
import {
  CanceledOrder,
  Fee,
  FilledOrder,
  OpeningOrder,
  OrderId,
  OrderPrice,
  OrderQuantity,
  PendingOrder,
  RejectedOrder,
  SubmittedOrder,
  TriggeredOrder,
} from '#features/shared/order.js';
import { ValidDate } from '#shared/utils/date.js';
import { Unbrand } from '#shared/utils/types.js';

type PendingMarketOrder = Extract<PendingOrder, { type: 'MARKET' }>;
type UnbrandPendingMarketOrder = Unbrand<PendingMarketOrder>;
export function mockPendingMarketOrder<T extends DeepPartial<UnbrandPendingMarketOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandPendingMarketOrder>>,
): PendingMarketOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<PendingMarketOrder, DeepPartial<UnbrandPendingMarketOrder>>(
    {
      id: 'KUDZPl2puQ' as OrderId,
      orderSide: 'ENTRY',
      type: 'MARKET',
      quantity: 10.1 as OrderQuantity,
      status: 'PENDING',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as PendingMarketOrder & Pick<T, 'orderSide'>;
}

type PendingLimitOrder = Extract<PendingOrder, { type: 'LIMIT' }>;
type UnbrandPendingLimitOrder = Unbrand<PendingLimitOrder>;
export function mockPendingLimitOrder<T extends DeepPartial<UnbrandPendingLimitOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandPendingLimitOrder>>,
): PendingLimitOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<PendingLimitOrder, DeepPartial<UnbrandPendingLimitOrder>>(
    {
      id: 'bF91DOBaLt' as OrderId,
      orderSide: 'ENTRY',
      type: 'LIMIT',
      quantity: 10.1 as OrderQuantity,
      limitPrice: 1.1 as OrderPrice,
      status: 'PENDING',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as PendingLimitOrder & Pick<T, 'orderSide'>;
}

type PendingStopMarketOrder = Extract<PendingOrder, { type: 'STOP_MARKET' }>;
type UnbrandPendingStopMarketOrder = Unbrand<PendingStopMarketOrder>;
export function mockPendingStopMarketOrder<T extends DeepPartial<UnbrandPendingStopMarketOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandPendingStopMarketOrder>>,
): PendingStopMarketOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<PendingStopMarketOrder, DeepPartial<UnbrandPendingStopMarketOrder>>(
    {
      id: 'QhZeHoys_A' as OrderId,
      orderSide: 'ENTRY',
      type: 'STOP_MARKET',
      quantity: 10.1 as OrderQuantity,
      stopPrice: 1.1 as OrderPrice,
      status: 'PENDING',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as PendingStopMarketOrder & Pick<T, 'orderSide'>;
}

type PendingStopLimitOrder = Extract<PendingOrder, { type: 'STOP_LIMIT' }>;
type UnbrandPendingStopLimitOrder = Unbrand<PendingStopLimitOrder>;
export function mockPendingStopLimitOrder<T extends DeepPartial<UnbrandPendingStopLimitOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandPendingStopLimitOrder>>,
): PendingStopLimitOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<PendingStopLimitOrder, DeepPartial<UnbrandPendingStopLimitOrder>>(
    {
      id: 'tgaPs969ne' as OrderId,
      orderSide: 'ENTRY',
      type: 'STOP_LIMIT',
      quantity: 10.1 as OrderQuantity,
      stopPrice: 1.1 as OrderPrice,
      limitPrice: 1.1 as OrderPrice,
      status: 'PENDING',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as PendingStopLimitOrder & Pick<T, 'orderSide'>;
}

type PendingCancelOrder = Extract<PendingOrder, { type: 'CANCEL' }>;
type UnbrandPendingCancelOrder = Unbrand<PendingCancelOrder>;
export function mockPendingCancelOrder(
  overrides?: DeepPartial<UnbrandPendingCancelOrder>,
): PendingCancelOrder {
  return mergeDeepRight<PendingCancelOrder, DeepPartial<UnbrandPendingCancelOrder>>(
    {
      id: '6YxM79Ya_J' as OrderId,
      type: 'CANCEL',
      orderIdToCancel: 'gJkkHUwhnl' as OrderId,
      status: 'PENDING',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as PendingCancelOrder;
}

type UnbrandSubmittedOrder = Unbrand<SubmittedOrder>;
export function mockSubmittedCancelOrder(overrides?: DeepPartial<UnbrandSubmittedOrder>): SubmittedOrder {
  return mergeDeepRight<SubmittedOrder, DeepPartial<UnbrandSubmittedOrder>>(
    {
      id: '6YxM79Ya_J' as OrderId,
      type: 'CANCEL',
      orderIdToCancel: 'gJkkHUwhnl' as OrderId,
      status: 'SUBMITTED',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as SubmittedOrder;
}

type OpeningLimitOrder = Extract<OpeningOrder, { type: 'LIMIT' }>;
type UnbrandOpeningLimitOrder = Unbrand<OpeningLimitOrder>;
export function mockOpeningLimitOrder<T extends DeepPartial<UnbrandOpeningLimitOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandOpeningLimitOrder>>,
): OpeningLimitOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<OpeningLimitOrder, DeepPartial<UnbrandOpeningLimitOrder>>(
    {
      id: '4o3AjHrwtA' as OrderId,
      orderSide: 'ENTRY',
      type: 'LIMIT',
      quantity: 10.1 as OrderQuantity,
      limitPrice: 1.1 as OrderPrice,
      status: 'OPENING',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as OpeningLimitOrder & Pick<T, 'orderSide'>;
}

type OpeningStopMarketOrder = Extract<OpeningOrder, { type: 'STOP_MARKET' }>;
type UnbrandOpeningStopMarketOrder = Unbrand<OpeningStopMarketOrder>;
export function mockOpeningStopMarketOrder<T extends DeepPartial<UnbrandOpeningStopMarketOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandOpeningStopMarketOrder>>,
): OpeningStopMarketOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<OpeningStopMarketOrder, DeepPartial<UnbrandOpeningStopMarketOrder>>(
    {
      id: 'NJF_icRMDP' as OrderId,
      orderSide: 'ENTRY',
      type: 'STOP_MARKET',
      quantity: 10.1 as OrderQuantity,
      stopPrice: 1.1 as OrderPrice,
      status: 'OPENING',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as OpeningStopMarketOrder & Pick<T, 'orderSide'>;
}

type OpeningStopLimitOrder = Extract<OpeningOrder, { type: 'STOP_LIMIT' }>;
type UnbrandOpeningStopLimitOrder = Unbrand<OpeningStopLimitOrder>;
export function mockOpeningStopLimitOrder<T extends DeepPartial<UnbrandOpeningStopLimitOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandOpeningStopLimitOrder>>,
): OpeningStopLimitOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<OpeningStopLimitOrder, DeepPartial<UnbrandOpeningStopLimitOrder>>(
    {
      id: 't9g990KVMk' as OrderId,
      orderSide: 'ENTRY',
      type: 'STOP_LIMIT',
      quantity: 10.1 as OrderQuantity,
      stopPrice: 1.1 as OrderPrice,
      limitPrice: 1.1 as OrderPrice,
      status: 'OPENING',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as OpeningStopLimitOrder & Pick<T, 'orderSide'>;
}

type UnbrandTriggeredOrder = Unbrand<TriggeredOrder>;
export function mockTriggeredOrder(overrides?: DeepPartial<UnbrandTriggeredOrder>): TriggeredOrder {
  return mergeDeepRight<TriggeredOrder, DeepPartial<UnbrandTriggeredOrder>>(
    {
      id: '6_VuAoSiX0' as OrderId,
      orderSide: 'ENTRY',
      type: 'STOP_LIMIT',
      quantity: 10.1 as OrderQuantity,
      stopPrice: 1.1 as OrderPrice,
      limitPrice: 1.1 as OrderPrice,
      status: 'TRIGGERED',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as TriggeredOrder;
}

type FilledMarketOrder = Extract<FilledOrder, { type: 'MARKET' }>;
type UnbrandFilledMarketOrder = Unbrand<FilledMarketOrder>;
export function mockFilledMarketOrder<T extends DeepPartial<UnbrandFilledMarketOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandFilledMarketOrder>>,
): FilledMarketOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<FilledMarketOrder, DeepPartial<UnbrandFilledMarketOrder>>(
    {
      id: 'Rnf23hJNmm' as OrderId,
      orderSide: 'ENTRY',
      type: 'MARKET',
      quantity: 10.1 as OrderQuantity,
      status: 'FILLED',
      filledPrice: 1.1 as Price,
      fee: { amount: 0.1, currency: 'USDT' } as Fee,
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
      filledAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as FilledMarketOrder & Pick<T, 'orderSide'>;
}

type FilledLimitOrder = Extract<FilledOrder, { type: 'LIMIT' }>;
type UnbrandFilledLimitOrder = Unbrand<FilledLimitOrder>;
export function mockFilledLimitOrder<T extends DeepPartial<UnbrandFilledLimitOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandFilledLimitOrder>>,
): FilledLimitOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<FilledLimitOrder, DeepPartial<UnbrandFilledLimitOrder>>(
    {
      id: 'lz8dPcvNcv' as OrderId,
      orderSide: 'ENTRY',
      type: 'LIMIT',
      quantity: 10.1 as OrderQuantity,
      limitPrice: 7.7 as OrderPrice,
      status: 'FILLED',
      filledPrice: 1.1 as Price,
      fee: { amount: 0.1, currency: 'USDT' } as Fee,
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
      filledAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as FilledLimitOrder & Pick<T, 'orderSide'>;
}

type FilledStopMarketOrder = Extract<FilledOrder, { type: 'STOP_MARKET' }>;
type UnbrandFilledStopMarketOrder = Unbrand<FilledStopMarketOrder>;
export function mockFilledStopMarketOrder<T extends DeepPartial<UnbrandFilledStopMarketOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandFilledStopMarketOrder>>,
): FilledStopMarketOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<FilledStopMarketOrder, DeepPartial<UnbrandFilledStopMarketOrder>>(
    {
      id: 'JQatXqJF8d' as OrderId,
      orderSide: 'ENTRY',
      type: 'STOP_MARKET',
      quantity: 10.1 as OrderQuantity,
      stopPrice: 7.7 as OrderPrice,
      status: 'FILLED',
      filledPrice: 1.1 as Price,
      fee: { amount: 0.1, currency: 'USDT' } as Fee,
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
      filledAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as FilledStopMarketOrder & Pick<T, 'orderSide'>;
}

type FilledStopLimitOrder = Extract<FilledOrder, { type: 'STOP_LIMIT' }>;
type UnbrandFilledStopLimitOrder = Unbrand<FilledStopLimitOrder>;
export function mockFilledStopLimitOrder<T extends DeepPartial<UnbrandFilledStopLimitOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandFilledStopLimitOrder>>,
): FilledStopLimitOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<FilledStopLimitOrder, DeepPartial<UnbrandFilledStopLimitOrder>>(
    {
      id: 'ENM7nTJLv4' as OrderId,
      orderSide: 'ENTRY',
      type: 'STOP_LIMIT',
      quantity: 10.1 as OrderQuantity,
      stopPrice: 7.7 as OrderPrice,
      limitPrice: 8.8 as OrderPrice,
      status: 'FILLED',
      filledPrice: 1.1 as Price,
      fee: { amount: 0.1, currency: 'USDT' } as Fee,
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
      filledAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as FilledStopLimitOrder & Pick<T, 'orderSide'>;
}

type CanceledLimitOrder = Extract<CanceledOrder, { type: 'LIMIT' }>;
type UnbrandCanceledLimitOrder = Unbrand<CanceledLimitOrder>;
export function mockCanceledLimitOrder<T extends DeepPartial<UnbrandCanceledLimitOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandCanceledLimitOrder>>,
): CanceledLimitOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<CanceledLimitOrder, DeepPartial<UnbrandCanceledLimitOrder>>(
    {
      id: 'imWo1snCfF' as OrderId,
      orderSide: 'ENTRY',
      type: 'LIMIT',
      quantity: 10.1 as OrderQuantity,
      limitPrice: 100.1 as OrderPrice,
      status: 'CANCELED',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
      canceledAt: new Date('2022-05-05T14:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as CanceledLimitOrder & Pick<T, 'orderSide'>;
}

type CanceledStopMarketOrder = Extract<CanceledOrder, { type: 'STOP_MARKET' }>;
type UnbrandCanceledStopMarketOrder = Unbrand<CanceledStopMarketOrder>;
export function mockCanceledStopMarketOrder<T extends DeepPartial<UnbrandCanceledStopMarketOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandCanceledStopMarketOrder>>,
): CanceledStopMarketOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<CanceledStopMarketOrder, DeepPartial<UnbrandCanceledStopMarketOrder>>(
    {
      id: '5aJQgFVUMu' as OrderId,
      orderSide: 'ENTRY',
      type: 'STOP_MARKET',
      quantity: 10.1 as OrderQuantity,
      stopPrice: 100.1 as OrderPrice,
      status: 'CANCELED',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
      canceledAt: new Date('2022-05-05T14:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as CanceledStopMarketOrder & Pick<T, 'orderSide'>;
}

type CanceledStopLimitOrder = Extract<CanceledOrder, { type: 'STOP_LIMIT' }>;
type UnbrandCanceledStopLimitOrder = Unbrand<CanceledStopLimitOrder>;
export function mockCanceledStopLimitOrder<T extends DeepPartial<UnbrandCanceledStopLimitOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandCanceledStopLimitOrder>>,
): CanceledStopLimitOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<CanceledStopLimitOrder, DeepPartial<UnbrandCanceledStopLimitOrder>>(
    {
      id: 'qM-ugAOSEz' as OrderId,
      orderSide: 'ENTRY',
      type: 'STOP_LIMIT',
      quantity: 10.1 as OrderQuantity,
      stopPrice: 100.1 as OrderPrice,
      limitPrice: 100.1 as OrderPrice,
      status: 'CANCELED',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T13:00:00Z') as ValidDate,
      canceledAt: new Date('2022-05-05T14:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as CanceledStopLimitOrder & Pick<T, 'orderSide'>;
}

type RejectedMarketOrder = Extract<RejectedOrder, { type: 'MARKET' }>;
type UnbrandRejectedMarketOrder = Unbrand<RejectedMarketOrder>;
export function mockRejectedMarket<T extends DeepPartial<UnbrandRejectedMarketOrder>>(
  overrides?: Exact<T, DeepPartial<UnbrandRejectedMarketOrder>>,
): RejectedMarketOrder & Pick<T, 'orderSide'> {
  return mergeDeepRight<RejectedMarketOrder, DeepPartial<UnbrandRejectedMarketOrder>>(
    {
      id: 'KUDZPl2puQ' as OrderId,
      orderSide: 'ENTRY',
      type: 'MARKET',
      quantity: 10.1 as OrderQuantity,
      status: 'REJECTED',
      reason: 'Error',
      createdAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
      submittedAt: new Date('2022-05-05T12:00:00Z') as ValidDate,
    },
    overrides ?? {},
  ) as RejectedMarketOrder & Pick<T, 'orderSide'>;
}
