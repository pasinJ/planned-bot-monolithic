import io from 'fp-ts/lib/IO.js';
import { z } from 'zod';

import { nonEmptyStringSchema } from '#shared/utils/string.js';

export type MongoDbConfig = Readonly<{ URI: MongoDbUri }>;

export type MongoDbUri = z.infer<typeof mongoDbUriSchema>;
const mongoDbUriSchema = nonEmptyStringSchema
  .pipe(z.string().regex(/^mongodb:\/{2}/))
  .catch('mongodb://localhost:27017')
  .brand('MongoDbUri');

export const getMongoDbConfig: io.IO<MongoDbConfig> = () => {
  return { URI: mongoDbUriSchema.parse(process.env.MONGODB_URI) };
};
