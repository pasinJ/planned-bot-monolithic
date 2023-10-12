import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyStringSchema } from '#shared/utils/string.js';

export type BtJobConfig = Readonly<{
  JOB_CONCURRENCY: BtJobConcurrency;
  JOB_TIMEOUT_MS: BtJobTimeout;
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

export type BtWorkerModulePath = z.infer<typeof btWorkerModulePath>;
const btWorkerModulePath = nonEmptyStringSchema.catch('./worker.ts').brand('BtWorkerModulePath');

export const getBtJobConfig: io.IO<BtJobConfig> = () => {
  return {
    JOB_CONCURRENCY: btJobConcurrencySchema.parse(process.env.BT_JOB_CONCURRENCY),
    JOB_TIMEOUT_MS: btJobTimeout.parse(process.env.BT_JOB_TIMEOUT_MS),
    JOB_WORKER_MODULE_PATH: btWorkerModulePath.parse(process.env.BT_JOB_WORKER_MODULE_PATH),
  };
};
