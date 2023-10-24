import { z } from 'zod';

import { schemaForType } from '#shared/utils/zod';

export type BtExecutionId = string & z.BRAND<'BtExecutionId'>;
export const btExecutionId = schemaForType<BtExecutionId>().with(z.string().brand('BtExecutionId'));

export type BtExecutionStatus = z.infer<typeof btExecutionStatusSchema>;
export const btExecutionStatusSchema = z.enum([
  'PENDING',
  'RUNNING',
  'TIMEOUT',
  'FAILED',
  'CANCELED',
  'INTERUPTED',
  'FINISHED',
]);
export const btExecutionStatusEnum = btExecutionStatusSchema.enum;
export const btExecutionStatusOptions = btExecutionStatusSchema.options;

export type ProgressPercentage = number & z.BRAND<'ProgressPercentage'>;
export const progressPercentageSchema = schemaForType<ProgressPercentage>().with(
  z.number().brand('ProgressPercentage'),
);

export type ExecutionLogs = readonly string[];
export const executionLogsSchema = schemaForType<ExecutionLogs>().with(z.array(z.string()));

export type ExecutionTime = number & z.BRAND<'ExecutionTime'>;
export const executionTimeSchema = schemaForType<ExecutionTime>().with(z.number().brand('ExecutionTime'));
