import { isBefore } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import type { Kline } from '#SECT/Kline.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { nonNegativeFloat8DigitsSchema } from '#shared/utils/number.js';
import { validateWithZod } from '#shared/utils/zod.js';

import { ExchangeName } from './exchange.js';
import { SymbolName } from './symbol.js';
import { Timeframe } from './timeframe.js';

export type { Kline, Price, Volume, NumTrades } from '#SECT/Kline.js';

const priceSchema = nonNegativeFloat8DigitsSchema.brand('Price');
const volumeSchema = nonNegativeFloat8DigitsSchema.brand('Volume');
const numTradesSchema = z.number().nonnegative().int().brand('NumTrades');

export function createKline(data: {
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
}): e.Either<GeneralError<'CreateKlineFailed'>, Kline> {
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
    validateWithZod(klineModelSchema, 'Validating kline schema failed', data),
    e.bimap(
      (error) =>
        createGeneralError(
          'CreateKlineFailed',
          'Creating a new kline failed because the given data is invalid',
          error,
        ),
      (kline) => kline as Kline,
    ),
  );
}
