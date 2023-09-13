import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyString } from '#shared/common.type.js';

export type JobSchedulerConfig = { URI: MongoDbUri; COLLECTION_NAME: string };

type MongoDbUri = z.infer<typeof mongoDbUriSchema>;
const mongoDbUriSchema = nonEmptyString
  .regex(/^mongodb:\/{2}/)
  .or(z.undefined())
  .catch(undefined)
  .brand('MongoDbUri');

export const getJobSchedulerConfig: io.IO<JobSchedulerConfig> = () => {
  return {
    URI: mongoDbUriSchema.parse(process.env.MONGODB_URI),
    COLLECTION_NAME: nonEmptyString.catch('agenda').parse(process.env.JOB_COLLECTION_NAME),
  };
};
