import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyStringSchema } from '#shared/utils/string.js';

export type BtJobConfig = Readonly<{
  JOB_CONCURRENCY: BtJobConcurrency;
  JOB_TIMEOUT_MS: BtJobTimeout;
  ITERATION_TIMEOUT_MS: BtIterationTimeout;
  PROGRESS_UPDATE_INTERVAL: BtProgressUpdateInterval;
  JOB_WORKER_MODULE_PATH: BtWorkerModulePath;
}>;

export type BtJobConcurrency = z.infer<typeof btJobConcurrencySchema>;
const btJobConcurrencySchema = nonEmptyStringSchema
  .pipe(z.coerce.number().int().positive())
  .catch(1)
  .brand('BtJobConcurrency');

export type BtJobTimeout = z.infer<typeof btJobTimeout>;
const btJobTimeout = nonEmptyStringSchema
  .pipe(z.coerce.number().int().positive())
  .catch(10000)
  .brand('BtJobTimeout');

export type BtIterationTimeout = z.infer<typeof btIterationTimeout>;
const btIterationTimeout = nonEmptyStringSchema
  .pipe(z.coerce.number().int().positive())
  .catch(5000)
  .brand('BtIterationTimeout');

export type BtProgressUpdateInterval = z.infer<typeof btProgressUpdateIntervalSchema>;
const btProgressUpdateIntervalSchema = nonEmptyStringSchema
  .pipe(z.coerce.number().int().positive())
  .catch(1000)
  .brand('BtProgressUpdateInterval');

export type BtWorkerModulePath = z.infer<typeof btWorkerModulePath>;
const btWorkerModulePath = nonEmptyStringSchema.catch('./worker.ts').brand('BtWorkerModulePath');

export const getBtJobConfig: io.IO<BtJobConfig> = () => {
  return {
    JOB_CONCURRENCY: btJobConcurrencySchema.parse(process.env.BT_JOB_CONCURRENCY),
    JOB_TIMEOUT_MS: btJobTimeout.parse(process.env.BT_JOB_TIMEOUT_MS),
    ITERATION_TIMEOUT_MS: btIterationTimeout.parse(process.env.BT_ITERATION_TIMEOUT_MS),
    PROGRESS_UPDATE_INTERVAL: btProgressUpdateIntervalSchema.parse(process.env.BT_PROGRESS_UPDATE_INTERVAL),
    JOB_WORKER_MODULE_PATH: btWorkerModulePath.parse(process.env.BT_JOB_WORKER_MODULE_PATH),
  };
};
