import { isBefore } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import { ExchangeName, exchangeNameSchema } from '#features/shared/domain/exchangeName.js';
import { SymbolName, symbolNameSchema } from '#features/shared/domain/symbolName.js';
import { timeframeSchema } from '#features/shared/domain/timeframe.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { validateWithZod } from '#shared/utils/zod.js';

export type KlineModel = z.infer<typeof klineModelSchema>;
const klineModelSchema = z
  .object({
    exchange: exchangeNameSchema,
    symbol: symbolNameSchema,
    timeframe: timeframeSchema,
    openTimestamp: z.number().positive().int().pipe(z.coerce.date()),
    closeTimestamp: z.number().positive().int().pipe(z.coerce.date()),
    open: z.number().positive(),
    close: z.number().positive(),
    high: z.number().positive(),
    low: z.number().positive(),
    volume: z.number().nonnegative(),
    quoteAssetVolume: z.number().nonnegative(),
    takerBuyBaseAssetVolume: z.number().nonnegative(),
    takerBuyQuoteAssetVolume: z.number().nonnegative(),
    numTrades: z.number().nonnegative().int(),
  })
  .refine(
    ({ openTimestamp, closeTimestamp }) => isBefore(openTimestamp, closeTimestamp),
    ({ openTimestamp, closeTimestamp }) => ({
      message: `close timestamp (${closeTimestamp.toISOString()}) must be after open timestamp (${openTimestamp.toISOString()})`,
      path: ['endTimestamp'],
    }),
  );

export type CreateKlineModelError = GeneralError<'CreateKlineModelFailed'>;
export function createKlineModel(data: {
  exchange: ExchangeName;
  symbol: SymbolName;
  timeframe: string;
  openTimestamp: number;
  closeTimestamp: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  quoteAssetVolume: number;
  takerBuyBaseAssetVolume: number;
  takerBuyQuoteAssetVolume: number;
  numTrades: number;
}): e.Either<CreateKlineModelError, KlineModel> {
  return pipe(
    validateWithZod(klineModelSchema, 'Validating kline model schema failed', data),
    e.mapLeft((error) =>
      createGeneralError(
        'CreateKlineModelFailed',
        'Creating a new kline model failed because the given data is invalid',
        error,
      ),
    ),
  );
}
