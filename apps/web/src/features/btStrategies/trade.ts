import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { schemaForType } from '#shared/utils/zod';

import { FilledEntryOrder, FilledExitOrder, filledEntryOrderSchema, filledExitOrderSchema } from './order';

export type TradeId = string & z.BRAND<'TradeId'>;
export const tradeIdSchema = schemaForType<TradeId>().with(z.string().brand('TradeId'));

export type TradeQuantity = number & z.BRAND<'TradeQuantity'>;
export const tradeQuantitySchema = schemaForType<TradeQuantity>().with(z.number().brand('TradeQuantity'));

export type TradeDrawdown = number & z.BRAND<'TradeDrawdown'>;
export const tradeDrawdownSchema = schemaForType<TradeDrawdown>().with(z.number().brand('TradeDrawdown'));

export type TradeRunup = number & z.BRAND<'TradeRunup'>;
export const tradeRunupSchema = schemaForType<TradeRunup>().with(z.number().brand('TradeRunup'));

export type UnrealizedReturn = number & z.BRAND<'UnrealizedReturn'>;
export const unrealizedReturnSchema = schemaForType<UnrealizedReturn>().with(
  z.number().brand('UnrealizedReturn'),
);

export type NetReturn = number & z.BRAND<'NetReturn'>;
export const netReturnSchema = schemaForType<NetReturn>().with(z.number().brand('NetReturn'));

export type OpeningTrade = DeepReadonly<{
  id: TradeId;
  entryOrder: FilledEntryOrder;
  tradeQuantity: TradeQuantity;
  maxRunup: TradeRunup;
  maxDrawdown: TradeDrawdown;
  unrealizedReturn: UnrealizedReturn;
}>;
export const openingTradeSchema = schemaForType<OpeningTrade>().with(
  z
    .object({
      id: tradeIdSchema,
      entryOrder: filledEntryOrderSchema,
      tradeQuantity: tradeQuantitySchema,
      maxRunup: tradeRunupSchema,
      maxDrawdown: tradeDrawdownSchema,
      unrealizedReturn: unrealizedReturnSchema,
    })
    .readonly(),
);

export type ClosedTrade = Omit<OpeningTrade, 'unrealizedReturn'> & {
  exitOrder: FilledExitOrder;
  netReturn: NetReturn;
};
export const closedTradeSchema = schemaForType<ClosedTrade>().with(
  z
    .object({
      id: tradeIdSchema,
      entryOrder: filledEntryOrderSchema,
      exitOrder: filledExitOrderSchema,
      tradeQuantity: tradeQuantitySchema,
      maxRunup: tradeRunupSchema,
      maxDrawdown: tradeDrawdownSchema,
      netReturn: netReturnSchema,
    })
    .readonly(),
);
