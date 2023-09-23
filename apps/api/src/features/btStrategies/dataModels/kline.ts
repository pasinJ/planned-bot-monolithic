import { isBefore } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import { ExchangeName } from '#features/shared/domain/exchange.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { SymbolName } from '#features/symbols/dataModels/symbol.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';
import { nonNegativeFloat8DigitsSchema } from '#shared/utils/number.js';
import { validateWithZod } from '#shared/utils/zod.js';

export type KlineModel = Readonly<{
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

export type Price = z.infer<typeof priceSchema>;
const priceSchema = nonNegativeFloat8DigitsSchema.brand('Price');

export type Volume = z.infer<typeof volumeSchema>;
const volumeSchema = nonNegativeFloat8DigitsSchema.brand('Volume');

export type NumTrades = z.infer<typeof numTradesSchema>;
const numTradesSchema = z.number().nonnegative().int().brand('NumTrades');

export type CreateKlineModelError = GeneralError<'CreateKlineModelFailed'>;
export function createKlineModel(data: {
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: Timeframe;
  openTimestamp: number;
  closeTimestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteAssetVolume: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
  numTrades: number;
}): e.Either<CreateKlineModelError, KlineModel> {
  const klineModelSchema = z
    .object({
      exchange: z.any(),
      symbol: z.any(),
      timeframe: z.any(),
      openTimestamp: z.number().int().pipe(z.coerce.date()),
      closeTimestamp: z.number().int().pipe(z.coerce.date()),
      open: priceSchema,
      close: priceSchema,
      high: priceSchema,
      low: priceSchema,
      volume: volumeSchema,
      quoteAssetVolume: volumeSchema,
      takerBuyBaseAssetVolume: volumeSchema,
      takerBuyQuoteAssetVolume: volumeSchema,
      numTrades: numTradesSchema,
    })
    .strict()
    .refine(
      ({ openTimestamp, closeTimestamp }) => isBefore(openTimestamp, closeTimestamp),
      ({ openTimestamp, closeTimestamp }) => ({
        message: `close timestamp (${closeTimestamp.toISOString()}) must be after open timestamp (${openTimestamp.toISOString()})`,
        path: ['closeTimestamp'],
      }),
    );

  return pipe(
    validateWithZod(klineModelSchema, 'Validating kline model schema failed', data),
    e.bimap(
      (error) =>
        createGeneralError(
          'CreateKlineModelFailed',
          'Creating a new kline model failed because the given data is invalid',
          error,
        ),
      (kline) => kline as KlineModel,
    ),
  );
}
