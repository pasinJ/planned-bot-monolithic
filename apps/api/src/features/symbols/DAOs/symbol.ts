import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { IndexDefinition, Model, Mongoose, SchemaDefinition } from 'mongoose';

import { exchangeNameList } from '#features/shared/domain/exchangeName.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { SymbolModel } from '../data-models/symbol.js';
import { SymbolDaoError, createSymbolDaoError } from './symbol.error.js';

type SymbolDocument = SymbolModel & { _id: string; __v: number };
export type SymbolMongooseModel = Model<SymbolDocument>;
export const symbolModelName = 'Symbol';

export type SymbolDao = {
  composeWith: <R>(fn: (internal: { mongooseModel: SymbolMongooseModel }) => R) => R;
};

export function buildSymbolDao(client: Mongoose): ioe.IOEither<SymbolDaoError<'BuildDaoFailed'>, SymbolDao> {
  return pipe(
    createMongooseModel(client),
    ioe.map((mongooseModel) => ({ composeWith: (fn) => fn({ mongooseModel }) })),
  );
}

function createMongooseModel(
  client: Mongoose,
): ioe.IOEither<SymbolDaoError<'BuildDaoFailed'>, SymbolMongooseModel> {
  const mongooseSchema: SchemaDefinition<SymbolDocument> = {
    name: { type: String, required: true },
    exchange: { type: String, required: true, enum: exchangeNameList },
    baseAsset: { type: String, required: true },
    baseAssetPrecision: { type: Number, required: true },
    quoteAsset: { type: String, required: true },
    quoteAssetPrecision: { type: Number, required: true },
    orderTypes: { type: [String], required: true },
    filters: { type: [], required: true },
  };
  const index: IndexDefinition = { name: 1, exchange: 1 };

  return pipe(
    ioe.tryCatch(
      () => new client.Schema<SymbolDocument>(mongooseSchema).index(index, { unique: true }),
      createErrorFromUnknown(
        createSymbolDaoError('BuildDaoFailed', 'Building symbol Mongoose model schema failed'),
      ),
    ),
    ioe.chain((schema) =>
      ioe.tryCatch(
        () => client.model(symbolModelName, schema),
        createErrorFromUnknown(
          createSymbolDaoError('BuildDaoFailed', 'Building symbol Mongoose model failed'),
        ),
      ),
    ),
  );
}
