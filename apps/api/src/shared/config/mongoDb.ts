import { z } from 'zod';

import { nonEmptyStringSchema } from './common.js';

export type MongoDbConfig = { URI: MongoDbUri };

export type MongoDbUri = z.infer<typeof mongoDbUriSchema>;
const mongoDbUriSchema = nonEmptyStringSchema
  .regex(/^mongodb:\/{2}/)
  .or(z.undefined())
  .catch(undefined)
  .brand('MongoDbUri');

export function getMongoDbConfig(): MongoDbConfig {
  return { URI: mongoDbUriSchema.parse(process.env.MONGODB_URI) };
}
