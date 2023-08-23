import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyString } from '#shared/common.type.js';

export type MongoDbConfig = { URI: MongoDbUri };

export type MongoDbUri = z.infer<typeof mongoDbUriSchema>;
const mongoDbUriSchema = nonEmptyString
  .regex(/^mongodb:\/{2}/)
  .or(z.undefined())
  .catch(undefined)
  .brand('MongoDbUri');

export const getMongoDbConfig: io.IO<MongoDbConfig> = () => {
  return { URI: mongoDbUriSchema.parse(process.env.MONGODB_URI) };
};
