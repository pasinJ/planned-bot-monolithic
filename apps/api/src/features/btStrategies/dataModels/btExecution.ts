import { differenceInMilliseconds, isAfter, isBefore, isEqual } from 'date-fns';
import { Decimal } from 'decimal.js';
import io from 'fp-ts/lib/IO.js';
import { nanoid } from 'nanoid';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { DateRange } from '#features/shared/objectValues/dateRange.js';
import { OrdersLists, TradesLists } from '#features/shared/strategyExecutor/executeStrategy.js';
import { StrategyModule } from '#features/shared/strategyExecutorContext/strategy.js';
import { Milliseconds, ValidDate } from '#shared/utils/date.js';
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

export type BtProgressPercentage = z.infer<typeof btProgressPercentageSchema>;
const btProgressPercentageSchema = nonNegativePercentage8DigitsSchema.brand('BtExecutionProgressPercentage');

export type BtExecutionProgress = DeepReadonly<{
  id: BtExecutionId;
  btStrategyId: BtStrategyId;
  status: BtExecutionStatus;
  percentage: BtProgressPercentage;
  logs: string[];
}>;

export const BT_PROGRESS_PERCENTAGE_START = 0 as BtProgressPercentage;
export const BT_PROGRESS_PERCENTAGE_FINISHED = 100 as BtProgressPercentage;

export type BtExecutionResult = BtExecutionSuccessfulResult | BtExecutionFailedResult;
export type BtExecutionSuccessfulResult = DeepReadonly<{
  id: BtExecutionId;
  btStrategyId: BtStrategyId;
  status: Extract<BtExecutionStatus, 'FINISHED'>;
  executionTimeMs: Milliseconds;
  logs: string[];
  strategyModule: StrategyModule;
  orders: OrdersLists;
  trades: TradesLists;
}>;
export type BtExecutionFailedResult = DeepReadonly<{
  id: BtExecutionId;
  btStrategyId: BtStrategyId;
  status: Extract<BtExecutionStatus, 'TIMEOUT' | 'FAILED' | 'CANCELED' | 'INTERUPTED'>;
  executionTimeMs: Milliseconds;
  logs: string[];
  error?: { name: string; type: string; message: string; causesList: string[] };
}>;

export const generateBtExecutionId: io.IO<BtExecutionId> = () => nanoid() as BtExecutionId;

export function calculateProgressPercentage(
  btDateRange: DateRange,
  processingDate: ValidDate,
): BtProgressPercentage {
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
  ) as BtProgressPercentage;
}
