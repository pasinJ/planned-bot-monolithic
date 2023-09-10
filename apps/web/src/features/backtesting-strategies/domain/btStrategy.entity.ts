import { isBefore, isEqual } from 'date-fns';
import { z } from 'zod';

import { exchangeNameSchema } from '#features/exchanges/domain/exchange';
import { nonEmptyString, nonNegativeFloat8Digits, nonNegativePercentage8Digits } from '#shared/common.type';
import { languageSchema } from '#shared/domain/language';
import { timeframeSchema } from '#shared/domain/timeframe';

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
