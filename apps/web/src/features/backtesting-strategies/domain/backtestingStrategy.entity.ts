import { isBefore, isEqual } from 'date-fns';
import { z } from 'zod';

import { exchangeNameSchema } from '#features/shared/domain/exchange';
import { timeframeSchema } from '#features/shared/domain/timeframe';
import { nonEmptyString, nonNegativeFloat, nonNegativePercentage } from '#utils/common.type';

export type BacktestingStrategyId = z.infer<typeof idSchema>;
const idSchema = nonEmptyString.brand('BacktestingStrategyId');

export type BacktestingStrategy = z.infer<typeof backtestingStrategySchema>;
export const backtestingStrategySchema = z
  .object({
    id: idSchema,
    name: nonEmptyString,
    exchange: exchangeNameSchema,
    symbol: nonEmptyString,
    currency: nonEmptyString,
    timeframe: timeframeSchema,
    initialCapital: nonNegativeFloat,
    takerFeeRate: nonNegativePercentage,
    makerFeeRate: nonNegativePercentage,
    maxNumKlines: z.number().positive().int(),
    startTimestamp: z.date(),
    endTimestamp: z.date(),
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
