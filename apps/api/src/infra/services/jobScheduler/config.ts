import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyStringSchema } from '#shared/utils/string.js';

export type JobSchedulerConfig = Readonly<{ URI: MongoDbUri; COLLECTION_NAME: string }>;

type MongoDbUri = z.infer<typeof mongoDbUriSchema>;
const mongoDbUriSchema = nonEmptyStringSchema
  .pipe(z.string().regex(/^mongodb:\/{2}/))
  .or(z.undefined())
  .catch(undefined)
  .brand('MongoDbUri');

export const getJobSchedulerConfig: io.IO<JobSchedulerConfig> = () => {
  return {
    URI: mongoDbUriSchema.parse(process.env.MONGODB_URI),
    COLLECTION_NAME: nonEmptyStringSchema.catch('agenda').parse(process.env.JOB_COLLECTION_NAME),
  };
};
