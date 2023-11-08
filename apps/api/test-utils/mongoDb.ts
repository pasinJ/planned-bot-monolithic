import mongoose, { Mongoose } from 'mongoose';
import { isNotNil } from 'ramda';

import { getMongoDbConfig } from '#infra/mongoDb/config.js';

export function createMongoClient(): Promise<Mongoose> {
  return mongoose.connect(getMongoDbConfig().URI, { connectTimeoutMS: 3000 });
}

export function deleteModel(client: Mongoose, modelName: string) {
  if (isNotNil(client.models[modelName])) client.deleteModel(modelName);
}

export async function clearCollections(client: Mongoose) {
  const db = client.connection.db;
  const collections = await db.listCollections().toArray();

  return Promise.all(
    collections
      .map((collection) => collection.name)
      .map((collectionName) =>
        collectionName.startsWith('system') ? Promise.resolve(undefined) : db.dropCollection(collectionName),
      ),
  );
}
