import { isBefore, isEqual } from 'date-fns';
import { z } from 'zod';

import { exchangeSchema } from '#features/shared/domain/exchange';
import { nonEmptyString, nonNegativePercentage } from '#utils/common.type';

export type BacktestingStrategyId = z.infer<typeof idSchema>;
const idSchema = nonEmptyString.brand('BacktestingStrategyId');

export type BacktestingStrategy = z.infer<typeof backtestingStrategySchema>;
export const backtestingStrategySchema = z
  .object({
    id: idSchema,
    name: nonEmptyString,
    exchange: exchangeSchema,
    currency: nonEmptyString,
    takerFeeRate: nonNegativePercentage,
    makerFeeRate: nonNegativePercentage,
    maxNumLastKline: z.number().positive().int(),
    body: nonEmptyString,
    version: z.number().nonnegative().int(),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict()
  .refine(
    ({ createdAt, updatedAt }) => isEqual(createdAt, updatedAt) || isBefore(createdAt, updatedAt),
    ({ createdAt, updatedAt }) => ({
      message: `updatedAt timestamp (${updatedAt.toISOString()}) must be equal or after createdAt timestamp (${createdAt.toISOString()})`,
      path: ['updatedAt'],
    }),
  );
