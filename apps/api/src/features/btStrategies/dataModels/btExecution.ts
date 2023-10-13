import { differenceInMilliseconds, isAfter, isBefore, isEqual } from 'date-fns';
import { Decimal } from 'decimal.js';
import io from 'fp-ts/lib/IO.js';
import { nanoid } from 'nanoid';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { DateRange } from '#features/shared/objectValues/dateRange.js';
import { ValidDate } from '#shared/utils/date.js';
import { nonNegativePercentage8DigitsSchema } from '#shared/utils/number.js';

import { BtStrategyId } from './btStrategy.js';

export type BtExecutionId = string & z.BRAND<'BtExecutionId'>;

export type BtExecutionStatus = z.infer<typeof btExecutionStatus>;
const btExecutionStatus = z.enum([
  'PENDING',
  'RUNNING',
  'TIMEOUT',
  'FAILED',
  'CANCELED',
  'INTERUPTED',
  'FINISHED',
]);
export const btExecutionStatusEnum = btExecutionStatus.enum;
export const btExecutionStatusList = btExecutionStatus.options;

export type BtExecutionProgressPercentage = z.infer<typeof btExecutionProgressPercentageSchema>;
const btExecutionProgressPercentageSchema = nonNegativePercentage8DigitsSchema.brand(
  'BtExecutionProgressPercentage',
);

export type BtExecutionProgress = DeepReadonly<{
  id: BtExecutionId;
  btStrategyId: BtStrategyId;
  status: BtExecutionStatus;
  percentage: BtExecutionProgressPercentage;
  logs: string[];
}>;

export const generateBtExecutionId: io.IO<BtExecutionId> = () => nanoid() as BtExecutionId;

export function calculateProgressPercentage(
  btDateRange: DateRange,
  processingDate: ValidDate,
): BtExecutionProgressPercentage {
  const isAfterOrEqual = (a: Date, b: Date) => isAfter(a, b) || isEqual(a, b);
  const isBeforeOrEqual = (a: Date, b: Date) => isBefore(a, b) || isEqual(a, b);

  return (
    isAfterOrEqual(processingDate, btDateRange.end)
      ? 100
      : isBeforeOrEqual(processingDate, btDateRange.start)
      ? 0
      : new Decimal(differenceInMilliseconds(processingDate, btDateRange.start))
          .times(100)
          .dividedBy(differenceInMilliseconds(btDateRange.end, btDateRange.start))
          .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
          .toNumber()
  ) as BtExecutionProgressPercentage;
}
