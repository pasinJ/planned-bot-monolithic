import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Model, Mongoose, SchemaDefinition } from 'mongoose';

import { exchangeNameList } from '#features/shared/exchange.js';
import { languageList } from '#features/shared/strategy.js';
import { timeframeList } from '#features/shared/timeframe.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { BtStrategyModel } from '../dataModels/btStrategy.js';
import { BtStrategyDaoError, createBtStrategyDaoError } from './btStrategy.error.js';

type BtStrategyDocument = BtStrategyModel & { _id: string; __v: number };
export type BtStrategyMongooseModel = Model<BtStrategyDocument>;
export const btStrategyModelName = 'BtStrategy';

export type BtStrategyDao = Readonly<{
  composeWith: <R>(fn: (internal: { mongooseModel: BtStrategyMongooseModel }) => R) => R;
}>;

type BuildBtStrategyDaoError = BtStrategyDaoError<'BuildDaoFailed'>;
export function buildBtStrategyDao(client: Mongoose): ioe.IOEither<BuildBtStrategyDaoError, BtStrategyDao> {
  return pipe(
    createMongooseModel(client),
    ioe.map((mongooseModel) => ({ composeWith: (fn) => fn({ mongooseModel }) })),
  );
}

function createMongooseModel(
  client: Mongoose,
): ioe.IOEither<BuildBtStrategyDaoError, BtStrategyMongooseModel> {
  const mongooseSchema: SchemaDefinition<BtStrategyDocument> = {
    _id: { type: String, alias: 'id', required: true },
    name: { type: String, required: true },
    exchange: { type: String, required: true, enum: exchangeNameList },
    symbol: { type: String, required: true },
    timeframe: { type: String, required: true, enum: timeframeList },
    initialCapital: { type: Number, required: true },
    assetCurrency: { type: String, required: true },
    capitalCurrency: { type: String, required: true },
    takerFeeRate: { type: Number, required: true },
    makerFeeRate: { type: Number, required: true },
    maxNumKlines: { type: Number, required: true },
    startTimestamp: { type: Date, required: true },
    endTimestamp: { type: Date, required: true },
    timezone: { type: String, required: true },
    language: { type: String, required: true, enum: languageList },
    body: { type: String, required: true },
    version: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  };

  return pipe(
    ioe.tryCatch(
      () => new client.Schema<BtStrategyDocument>(mongooseSchema, { timestamps: { updatedAt: true } }),
      createErrorFromUnknown(
        createBtStrategyDaoError(
          'BuildDaoFailed',
          'Creating a Mongoose model schema for backtesting strategy failed',
        ),
      ),
    ),
    ioe.chain((schema) =>
      ioe.tryCatch(
        () => client.model(btStrategyModelName, schema),
        createErrorFromUnknown(
          createBtStrategyDaoError(
            'BuildDaoFailed',
            'Creating a Mongoose model for backtesting strategy failed',
          ),
        ),
      ),
    ),
  );
}
