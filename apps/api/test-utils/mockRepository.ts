import te from 'fp-ts/lib/TaskEither.js';
import mongoose, { Mongoose } from 'mongoose';
import { isNotNil } from 'ramda';

import { SymbolRepository } from '#features/symbols/symbol.repository.type.js';
import { getMongoDbConfig } from '#shared/config/mongoDb.js';

export function createMongoClient(): Promise<Mongoose> {
  return mongoose.connect(getMongoDbConfig().URI);
}

export function deleteModel(client: Mongoose, modelName: string) {
  if (isNotNil(client.models[modelName])) client.deleteModel(modelName);
}

export function mockSymbolRepository(overrides?: Partial<SymbolRepository>): SymbolRepository {
  return {
    add: () => te.of(undefined),
    getAll: te.right([]),
    countAll: te.right(0),
    ...overrides,
  };
}
