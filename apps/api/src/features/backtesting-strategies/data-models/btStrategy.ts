import { isBefore, isEqual } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import { ExchangeName, exchangeNameSchema } from '#features/shared/domain/exchangeName.js';
import { languageSchema } from '#features/shared/domain/language.js';
import { SymbolName, symbolNameSchema } from '#features/shared/domain/symbolName.js';
import { timeframeSchema } from '#features/shared/domain/timeframe.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { validateWithZod } from '#shared/utils/zod.js';
import {
  nonEmptyString,
  nonNegativeFloat8Digits,
  nonNegativePercentage8Digits,
} from '#shared/utils/zod.schema.js';

export type BtStrategyId = z.infer<typeof idSchema>;
const idSchema = nonEmptyString.brand('BtStrategyId');

export type MaxNumKlines = z.infer<typeof maxNumKlinesSchema>;
const maxNumKlinesSchema = z.number().positive().int().brand('MaxNumKlines');

export type BtStrategyModel = z.infer<typeof btStrategyModelSchema>;
const btStrategyModelSchema = z
  .object({
    id: idSchema,
    name: nonEmptyString,
    exchange: exchangeNameSchema,
    symbol: symbolNameSchema,
    currency: nonEmptyString,
    timeframe: timeframeSchema,
    initialCapital: nonNegativeFloat8Digits,
    takerFeeRate: nonNegativePercentage8Digits,
    makerFeeRate: nonNegativePercentage8Digits,
    maxNumKlines: maxNumKlinesSchema,
    startTimestamp: z.date(),
    endTimestamp: z.date(),
    language: languageSchema,
    body: nonEmptyString,
    version: z.number().nonnegative().int(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .refine(
    ({ startTimestamp, endTimestamp }) => isBefore(startTimestamp, endTimestamp),
    ({ startTimestamp, endTimestamp }) => ({
      message: `end timestamp (${endTimestamp.toISOString()}) must be after start timestamp (${startTimestamp.toISOString()})`,
      path: ['endTimestamp'],
    }),
  )
  .refine(
    ({ createdAt, updatedAt }) => isEqual(createdAt, updatedAt) || isBefore(createdAt, updatedAt),
    ({ createdAt, updatedAt }) => ({
      message: `updatedAt timestamp (${updatedAt.toISOString()}) must be equal or after createdAt timestamp (${createdAt.toISOString()})`,
      path: ['updatedAt'],
    }),
  );

export function createBtStrategyModel(
  data: {
    id: string;
    name: string;
    exchange: ExchangeName;
    symbol: SymbolName;
    currency: string;
    timeframe: string;
    initialCapital: number;
    takerFeeRate: number;
    makerFeeRate: number;
    maxNumKlines: number;
    startTimestamp: Date;
    endTimestamp: Date;
    language: string;
    body: string;
  },
  currentDate: Date,
): e.Either<GeneralError<'CreateBtStrategyModelError'>, BtStrategyModel> {
  return pipe(
    validateWithZod(btStrategyModelSchema, 'Validating backtesting strategy schema failed', {
      ...data,
      version: 0,
      createdAt: currentDate,
      updatedAt: currentDate,
    }),
    e.mapLeft((error) =>
      createGeneralError(
        'CreateBtStrategyModelError',
        'Creating a new backtesting strategy model failed because the given data is invalid',
        error,
      ),
    ),
  );
}
