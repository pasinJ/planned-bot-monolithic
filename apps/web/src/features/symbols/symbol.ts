import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { ExchangeName, exchangeNameSchema } from '#features/exchanges/exchange';
import { schemaForType } from '#shared/utils/zod';

export type SymbolName = string & z.BRAND<'SymbolName'>;
export const symbolNameSchema = schemaForType<SymbolName>().with(z.string().brand('SymbolName'));

export type BaseAsset = string & z.BRAND<'BaseAsset'>;
export const baseAssetSchema = schemaForType<BaseAsset>().with(z.string().brand('BaseAsset'));

export type QuoteAsset = string & z.BRAND<'QuoteAsset'>;
export const quoteAssetschema = schemaForType<QuoteAsset>().with(z.string().brand('QuoteAsset'));

export type Symbol = DeepReadonly<{
  exchange: ExchangeName;
  name: SymbolName;
  baseAsset: BaseAsset;
  quoteAsset: QuoteAsset;
}>;
export const symbolSchema = schemaForType<Symbol>().with(
  z.object({
    name: symbolNameSchema,
    exchange: exchangeNameSchema,
    baseAsset: baseAssetSchema,
    quoteAsset: quoteAssetschema,
  }),
);
