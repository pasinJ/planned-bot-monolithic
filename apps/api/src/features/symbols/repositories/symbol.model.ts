import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { IndexDefinition, Model, Mongoose, SchemaDefinition } from 'mongoose';
import { values } from 'ramda';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { Symbol } from '../domain/symbol.entity.js';
import { SymbolRepoError, createSymbolRepoError } from './symbol.error.js';

export const symbolModelName = 'Symbol';

type SymbolDoc = Symbol & { _id: string; __v: number };
export type SymbolModel = Model<SymbolDoc>;

const symbolModelSchema: SchemaDefinition<SymbolDoc> = {
  _id: { type: String, alias: 'id', required: true },
  name: { type: String, required: true },
  exchange: { type: String, required: true, enum: values(exchangeNameEnum) },
  baseAsset: { type: String, required: true },
  baseAssetPrecision: { type: Number, required: true },
  quoteAsset: { type: String, required: true },
  quoteAssetPrecision: { type: Number, required: true },
  orderTypes: { type: [String], required: true },
  filters: { type: [], required: true },
  version: { type: Number, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
};
const index: IndexDefinition = { name: 1, exchange: 1 };

export function createSymbolModel(
  client: Mongoose,
): ioe.IOEither<SymbolRepoError<'CreateSymbolRepoError'>, SymbolModel> {
  return pipe(
    ioe.tryCatch(
      () => new client.Schema<SymbolDoc>(symbolModelSchema).index(index, { unique: true }),
      createErrorFromUnknown(
        createSymbolRepoError(
          'CreateSymbolRepoError',
          'Creating a model schema for symbol by Mongoose failed',
        ),
      ),
    ),
    ioe.chain((schema) =>
      ioe.tryCatch(
        () => client.model<SymbolDoc>(symbolModelName, schema),
        createErrorFromUnknown(
          createSymbolRepoError('CreateSymbolRepoError', 'Creating a model for symbol by Mongoose failed'),
        ),
      ),
    ),
  );
}
