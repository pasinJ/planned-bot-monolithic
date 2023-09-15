import { isBefore } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { SchemaValidationError, parseWithZod } from '#shared/utils/zod.js';

export type KlineModel = z.infer<typeof klineModelSchema>;
const klineModelSchema = z
  .object({
    openTimestamp: z.number().positive().int(),
    closeTimestamp: z.number().positive().int(),
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
      message: `close timestamp (${closeTimestamp}) must be after open timestamp (${openTimestamp})`,
      path: ['endTimestamp'],
    }),
  );

export type CreateKlineModelError = GeneralError<'CreateKlineModelFailed', SchemaValidationError>;
export function createKlineModel(data: {
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
    parseWithZod(klineModelSchema, 'Validating kline model schema failed', data),
    e.mapLeft((error) =>
      createGeneralError({
        type: 'CreateKlineModelFailed',
        message: 'Creating a new kline model failed because the given data is invalid',
        cause: error,
      }),
    ),
  );
}
