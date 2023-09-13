import { isBefore, isEqual } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import { exchangeNameSchema } from '#features/exchanges/domain/exchange.js';
import { languageSchema } from '#shared/domain/language.js';
import { timeframeSchema } from '#shared/domain/timeframe.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { SchemaValidationError, parseWithZod } from '#shared/utils/zod.js';
import {
  nonEmptyString,
  nonNegativeFloat8Digits,
  nonNegativePercentage8Digits,
} from '#shared/utils/zod.schema.js';

export type BtStrategyId = z.infer<typeof idSchema>;
const idSchema = nonEmptyString.brand('BtStrategyId');

export type BtStrategyModel = z.infer<typeof btStrategyModelSchema>;
const btStrategyModelSchema = z
  .object({
    id: idSchema,
    name: nonEmptyString,
    exchange: exchangeNameSchema,
    symbol: nonEmptyString,
    currency: nonEmptyString,
    timeframe: timeframeSchema,
    initialCapital: nonNegativeFloat8Digits,
    takerFeeRate: nonNegativePercentage8Digits,
    makerFeeRate: nonNegativePercentage8Digits,
    maxNumKlines: z.number().positive().int(),
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
    ({ startTimestamp, endTimestamp }) =>
      isEqual(startTimestamp, endTimestamp) || isBefore(startTimestamp, endTimestamp),
    ({ startTimestamp, endTimestamp }) => ({
      message: `end timestamp (${endTimestamp.toISOString()}) must be equal or after start timestamp (${startTimestamp.toISOString()})`,
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
    exchange: string;
    symbol: string;
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
): e.Either<GeneralError<'CreateBtStrategyError', SchemaValidationError>, BtStrategyModel> {
  return pipe(
    parseWithZod(btStrategyModelSchema, 'Validating backtesting strategy schema failed', {
      ...data,
      version: 0,
      createdAt: currentDate,
      updatedAt: currentDate,
    }),
    e.mapLeft((error) =>
      createGeneralError({
        type: 'CreateBtStrategyError',
        message: 'Creating a new backtesting strategy model failed because the given data is invalid',
        cause: error,
      }),
    ),
  );
}
