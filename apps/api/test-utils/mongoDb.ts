import mongoose, { Mongoose } from 'mongoose';
import { isNotNil } from 'ramda';

import { getMongoDbConfig } from '#infra/mongoDb/config.js';

export function createMongoClient(): Promise<Mongoose> {
  return mongoose.connect(getMongoDbConfig().URI, { connectTimeoutMS: 3000 });
}

export function deleteModel(client: Mongoose, modelName: string) {
  if (isNotNil(client.models[modelName])) client.deleteModel(modelName);
}
