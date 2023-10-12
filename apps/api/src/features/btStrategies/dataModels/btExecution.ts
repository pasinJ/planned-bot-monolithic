import io from 'fp-ts/lib/IO.js';
import { nanoid } from 'nanoid';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

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

type BtExecutionProgressPercentage = z.infer<typeof btExecutionProgressPercentageSchema>;
const btExecutionProgressPercentageSchema = nonNegativePercentage8DigitsSchema.brand(
  'BtExecutionProgressPercentage',
);

export type BtExecutionProgress = DeepReadonly<{
  id: BtExecutionId;
  btStrategyId: BtStrategyId;
  status: BtExecutionStatus;
  progress: BtExecutionProgressPercentage;
  logs: string[];
}>;

export const generateBtExecutionId: io.IO<BtExecutionId> = () => nanoid() as BtExecutionId;
