import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyStringSchema } from '#shared/utils/string.js';

export type BtJobConfig = Readonly<{
  JOB_CONCURRENCY: BtJobConcurrency;
  JOB_TIMEOUT_MS: BtJobTimeout;
  PROGRESS_UPDATE_INTERVAL: BtProgressUpdateInterval;
  JOB_WORKER_FILE_PATH: BtWorkerFilePath;
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

export type BtProgressUpdateInterval = z.infer<typeof btProgressUpdateIntervalSchema>;
const btProgressUpdateIntervalSchema = nonEmptyStringSchema
  .pipe(z.coerce.number().int().positive())
  .catch(1000)
  .brand('BtProgressUpdateInterval');

export type BtWorkerFilePath = z.infer<typeof btWorkerFilePath>;
const btWorkerFilePath = nonEmptyStringSchema.catch('./worker.ts').brand('BtWorkerFilePath');

export const getBtJobConfig: io.IO<BtJobConfig> = () => {
  return {
    JOB_CONCURRENCY: btJobConcurrencySchema.parse(process.env.BT_JOB_CONCURRENCY),
    JOB_TIMEOUT_MS: btJobTimeout.parse(process.env.BT_JOB_TIMEOUT_MS),
    PROGRESS_UPDATE_INTERVAL: btProgressUpdateIntervalSchema.parse(process.env.BT_PROGRESS_UPDATE_INTERVAL),
    JOB_WORKER_FILE_PATH: btWorkerFilePath.parse(process.env.BT_JOB_WORKER_FILE_PATH),
  };
};
