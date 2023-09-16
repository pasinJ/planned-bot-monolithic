import io from 'fp-ts/lib/IO.js';

import {
  JobConcurrency,
  JobTimeout,
  jobConcurrencySchema,
  jobTimeout,
} from '#infra/services/jobScheduler/config.js';
import { nonEmptyString } from '#shared/utils/zod.schema.js';

export type BtJobConfig = {
  JOB_CONCURRENCY: JobConcurrency;
  JOB_TIMEOUT_MS: JobTimeout;
  JOB_WORKER_PATH: string;
};

export const getBtJobConfig: io.IO<BtJobConfig> = () => {
  return {
    JOB_CONCURRENCY: jobConcurrencySchema.catch(1 as JobConcurrency).parse(process.env.BT_JOB_CONCURRENCY),
    JOB_TIMEOUT_MS: jobTimeout.catch(10000 as JobTimeout).parse(process.env.BT_JOB_TIMEOUT_MS),
    JOB_WORKER_PATH: nonEmptyString.catch('./worker.ts').parse(process.env.BT_JOB_WORKER_PATH),
  };
};
