import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { IndexDefinition, Model, Mongoose, SchemaDefinition } from 'mongoose';

import { createErrorFromUnknown } from '#shared/error.js';

import { Symbol } from './domain/symbol.entity.js';
import { CreateSymbolRepositoryError } from './symbol.repository.type.js';

type SymbolDoc = Symbol & { _id: string; __v: number };
export type SymbolModel = Model<SymbolDoc>;

export const symbolModelName = 'Symbol';
const symbolSchema: SchemaDefinition<SymbolDoc> = {
  _id: { type: String, alias: 'id' },
  name: { type: String, required: true },
  exchange: { type: String, required: true },
  baseAsset: { type: String, required: true },
  baseAssetPrecision: { type: Number, required: true, min: 0 },
  quoteAsset: { type: String, required: true },
  quoteAssetPrecision: { type: Number, required: true, min: 0 },
  orderTypes: { type: [String], required: true },
  filters: { type: [], required: true },
  __v: { type: Number, alias: 'version' },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
};
const index: IndexDefinition = { name: 1, exchange: 1 };

export function createSymbolModel(client: Mongoose): ioe.IOEither<CreateSymbolRepositoryError, SymbolModel> {
  return pipe(
    ioe.tryCatch(
      () => new client.Schema<SymbolDoc>(symbolSchema).index(index, { unique: true }),
      createErrorFromUnknown(CreateSymbolRepositoryError, 'CREATE_SCHEMA_ERROR'),
    ),
    ioe.chain((schema) =>
      ioe.tryCatch(
        () => client.model<SymbolDoc>(symbolModelName, schema),
        createErrorFromUnknown(CreateSymbolRepositoryError, 'CREATE_MODEL_ERROR'),
      ),
    ),
  );
}
