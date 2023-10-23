import { z } from 'zod';

import { ExchangeName, exchangeNameSchema } from '#features/exchanges/domain/exchange';
import { SymbolName, symbolNameSchema } from '#features/symbols/domain/symbol';
import { ValidDate, validDateSchema } from '#shared/utils/date';
import { schemaForType } from '#shared/utils/zod';

export type Price = number & z.BRAND<'Price'>;
export const priceSchema = schemaForType<Price>().with(z.number().brand('Price'));
export type Volume = number & z.BRAND<'Volume'>;
export const volumeSchema = schemaForType<Volume>().with(z.number().brand('Volume'));
export type NumTrades = number & z.BRAND<'NumTrades'>;
export const numTradesSchema = schemaForType<NumTrades>().with(z.number().brand('NumTrades'));

export type Timeframe = z.infer<typeof timeframeSchema>;
export const timeframeSchema = z.enum([
  '1s',
  '1m',
  '3m',
  '5m',
  '15m',
  '30m',
  '1h',
  '2h',
  '4h',
  '6h',
  '8h',
  '12h',
  '1d',
  '3d',
  '1w',
  '1M',
]);
export const timeframeEnum = timeframeSchema.enum;

export type Kline = Readonly<{
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  openTimestamp: ValidDate;
  closeTimestamp: ValidDate;
  open: Price;
  high: Price;
  low: Price;
  close: Price;
  volume: Volume;
  quoteAssetVolume: Volume;
  takerBuyBaseAssetVolume: Volume;
  takerBuyQuoteAssetVolume: Volume;
  numTrades: NumTrades;
}>;
export const klineSchema = schemaForType<Kline>().with(
  z
    .object({
      exchange: exchangeNameSchema,
      symbol: symbolNameSchema,
      timeframe: timeframeSchema,
      openTimestamp: validDateSchema,
      closeTimestamp: validDateSchema,
      open: priceSchema,
      high: priceSchema,
      low: priceSchema,
      close: priceSchema,
      volume: volumeSchema,
      quoteAssetVolume: volumeSchema,
      takerBuyBaseAssetVolume: volumeSchema,
      takerBuyQuoteAssetVolume: volumeSchema,
      numTrades: numTradesSchema,
    })
    .readonly(),
);
