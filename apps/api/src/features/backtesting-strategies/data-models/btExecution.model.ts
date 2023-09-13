import io from 'fp-ts/lib/IO.js';
import { nanoid } from 'nanoid';
import { z } from 'zod';

export type BtExecutionId = string & z.BRAND<'BtExecutionId'>;

export type BtExecutionStatus = z.infer<typeof btExecutionStatus>;
const btExecutionStatus = z.enum(['pending', 'running', 'timeout', 'failed', 'canceled']);
export const btExecutionStatusEnum = btExecutionStatus.enum;

export const generateBtExecutionId: io.IO<BtExecutionId> = () => nanoid() as BtExecutionId;
