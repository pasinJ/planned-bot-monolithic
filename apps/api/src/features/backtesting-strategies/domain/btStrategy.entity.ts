import { isBefore, isEqual } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import { ExchangeName, exchangeNameSchema } from '#features/exchanges/domain/exchange.js';
import {
  nonEmptyString,
  nonNegativeFloat8Digits,
  nonNegativePercentage8Digits,
} from '#shared/common.type.js';
import { Timeframe, timeframeSchema } from '#shared/domain/timeframe.js';
import { CustomError } from '#shared/error.js';
import { SchemaValidationError, parseWithZod } from '#shared/utils/zod.js';

export type BtStrategyId = z.infer<typeof idSchema>;
const idSchema = nonEmptyString.brand('BtStrategyId');

export type ExecutionStatus = z.infer<typeof executionStatusSchema>;
const executionStatusSchema = z.enum(['IDLE']);
export const executionStatusEnum = executionStatusSchema.enum;

export type BtStrategy = z.infer<typeof btStrategySchema>;
export const btStrategySchema = z
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
    executionStatus: executionStatusSchema,
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

type CreateNewBtStrategyData = {
  id: string;
  name: string;
  exchange: ExchangeName;
  symbol: string;
  currency: string;
  timeframe: Timeframe;
  initialCapital: number;
  takerFeeRate: number;
  makerFeeRate: number;
  maxNumKlines: number;
  startTimestamp: Date;
  endTimestamp: Date;
  body: string;
};
export class CreateNewBtStrategyError extends CustomError<'CREATE_BT_STRATEGY_ERROR', SchemaValidationError>(
  'CREATE_BT_STRATEGY_ERROR',
  'Creating a new backtesting strategy entity failed because the given data is invalid',
) {}
export function createNewBtStrategy(
  data: CreateNewBtStrategyData,
  currentDate: Date,
): e.Either<CreateNewBtStrategyError, BtStrategy> {
  return pipe(
    parseWithZod(btStrategySchema, 'Validating backtesting strategy entity schema failed', {
      ...data,
      executionStatus: executionStatusEnum.IDLE,
      version: 0,
      createdAt: currentDate,
      updatedAt: currentDate,
    }),
    e.mapLeft((error) => new CreateNewBtStrategyError().causedBy(error)),
  );
}