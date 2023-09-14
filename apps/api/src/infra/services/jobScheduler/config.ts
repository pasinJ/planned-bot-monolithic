import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyString } from '#shared/utils/zod.schema.js';

export type JobSchedulerConfig = {
  URI: MongoDbUri;
  COLLECTION_NAME: string;
  BT_JOB_CONCURRENCY: JobConcurrency;
  BT_JOB_TIMEOUT_MS: JobTimeout;
};

type MongoDbUri = z.infer<typeof mongoDbUriSchema>;
const mongoDbUriSchema = nonEmptyString
  .regex(/^mongodb:\/{2}/)
  .or(z.undefined())
  .catch(undefined)
  .brand('MongoDbUri');

export type JobConcurrency = z.infer<typeof jobConcurrencySchema>;
const jobConcurrencySchema = nonEmptyString.pipe(z.coerce.number().int().positive()).brand('JobConcurrency');

export type JobTimeout = z.infer<typeof jobTimeout>;
const jobTimeout = nonEmptyString.pipe(z.coerce.number().int().positive()).brand('JobTimeout');

export const getJobSchedulerConfig: io.IO<JobSchedulerConfig> = () => {
  return {
    URI: mongoDbUriSchema.parse(process.env.MONGODB_URI),
    COLLECTION_NAME: nonEmptyString.catch('agenda').parse(process.env.JOB_COLLECTION_NAME),
    BT_JOB_CONCURRENCY: jobConcurrencySchema.catch(1 as JobConcurrency).parse(process.env.BT_JOB_CONCURRENCY),
    BT_JOB_TIMEOUT_MS: jobTimeout.catch(10000 as JobTimeout).parse(process.env.BT_JOB_TIMEOUT_MS),
  };
};
