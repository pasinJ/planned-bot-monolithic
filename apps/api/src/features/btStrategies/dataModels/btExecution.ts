import io from 'fp-ts/lib/IO.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

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

export const generateBtExecutionId: io.IO<BtExecutionId> = () => nanoid() as BtExecutionId;
