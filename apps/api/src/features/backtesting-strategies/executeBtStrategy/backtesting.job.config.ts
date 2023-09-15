import io from 'fp-ts/lib/IO.js';

import {
  JobConcurrency,
  JobTimeout,
  jobConcurrencySchema,
  jobTimeout,
} from '#infra/services/jobScheduler/config.js';

export type BtJobConfig = { BT_JOB_CONCURRENCY: JobConcurrency; BT_JOB_TIMEOUT_MS: JobTimeout };

export const getBtJobConfig: io.IO<BtJobConfig> = () => {
  return {
    BT_JOB_CONCURRENCY: jobConcurrencySchema.catch(1 as JobConcurrency).parse(process.env.BT_JOB_CONCURRENCY),
    BT_JOB_TIMEOUT_MS: jobTimeout.catch(10000 as JobTimeout).parse(process.env.BT_JOB_TIMEOUT_MS),
  };
};
