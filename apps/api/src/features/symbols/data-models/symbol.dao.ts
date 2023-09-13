import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { IndexDefinition, Model, Mongoose, SchemaDefinition } from 'mongoose';
import { nanoid } from 'nanoid';
import { isNotNil, omit, values } from 'ramda';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { SymbolId, SymbolModel } from './symbol-model/index.js';
import { SymbolModelDaoError, createSymbolModelDaoError } from './symbol.dao.error.js';
import { SymbolModelDao } from './symbol.dao.type.js';

export function createSymbolModelDao(
  client: Mongoose,
): ioe.IOEither<SymbolModelDaoError<'CreateDaoFailed'>, SymbolModelDao> {
  return pipe(
    createMongooseModel(client),
    ioe.map((model) => ({
      generateId: generateId(),
      add: add(model),
      getAll: getAll(model),
      existByExchange: existByExchange(model),
    })),
  );
}

type SymbolDocument = SymbolModel & { _id: string; __v: number };
export type SymbolMongooseModel = Model<SymbolDocument>;
export const symbolModelName = 'Symbol';

function createMongooseModel(
  client: Mongoose,
): ioe.IOEither<SymbolModelDaoError<'CreateDaoFailed'>, SymbolMongooseModel> {
  const mongooseSchema: SchemaDefinition<SymbolDocument> = {
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

  return pipe(
    ioe.tryCatch(
      () => new client.Schema<SymbolDocument>(mongooseSchema).index(index, { unique: true }),
      createErrorFromUnknown(
        createSymbolModelDaoError('CreateDaoFailed', 'Creating a Mongoose model schema for symbol failed'),
      ),
    ),
    ioe.chain((schema) =>
      ioe.tryCatch(
        () => client.model<SymbolDocument>(symbolModelName, schema),
        createErrorFromUnknown(
          createSymbolModelDaoError('CreateDaoFailed', 'Creating a Mongoose model for symbol failed'),
        ),
      ),
    ),
  );
}

function generateId(): SymbolModelDao['generateId'] {
  return () => nanoid() as SymbolId;
}

function add(model: SymbolMongooseModel): SymbolModelDao['add'] {
  return (symbols) =>
    pipe(
      te.tryCatch(
        () => model.insertMany(symbols),
        createErrorFromUnknown(createSymbolModelDaoError('AddFailed', 'Adding new symbol(s) failed')),
      ),
      te.asUnit,
    );
}

function getAll(model: SymbolMongooseModel): SymbolModelDao['getAll'] {
  return pipe(
    te.tryCatch(
      () => model.find(),
      createErrorFromUnknown(createSymbolModelDaoError('GetAllFailed', 'Getting all symbols failed')),
    ),
    te.map((list) => list.map((doc) => omit(['_id', '__v'], doc.toJSON({ virtuals: true })))),
  );
}

function existByExchange(model: SymbolMongooseModel): SymbolModelDao['existByExchange'] {
  return (exchange) =>
    pipe(
      te.tryCatch(
        () => model.exists({ exchange }),
        createErrorFromUnknown(
          createSymbolModelDaoError(
            'ExistByExchangeFailed',
            `Checking existence for symbols of exchange ${exchange} failed`,
          ),
        ),
      ),
      te.map(isNotNil),
    );
}
