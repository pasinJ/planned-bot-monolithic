import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { IndexDefinition, Model, Mongoose, SchemaDefinition } from 'mongoose';

import { exchangeNameList } from '#features/shared/domain/exchangeName.js';
import { timeframeList } from '#features/shared/domain/timeframe.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { KlineModel } from '../data-models/kline.js';
import { KlineDaoError, createKlineDaoError } from './kline.error.js';

type KlineDocument = KlineModel & { _id: string; __v: number };
export type KlineMongooseModel = Model<KlineDocument>;
export const klineModelName = 'Kline';

export type KlineDao = {
  composeWith: <R>(fn: (internal: { mongooseModel: KlineMongooseModel }) => R) => R;
};

export function buildKlineDao(client: Mongoose): ioe.IOEither<KlineDaoError<'BuildDaoFailed'>, KlineDao> {
  return pipe(
    createMongooseModel(client),
    ioe.map((mongooseModel) => ({ composeWith: (fn) => fn({ mongooseModel }) })),
  );
}

function createMongooseModel(
  client: Mongoose,
): ioe.IOEither<KlineDaoError<'BuildDaoFailed'>, KlineMongooseModel> {
  const mongooseSchema: SchemaDefinition<KlineDocument> = {
    exchange: { type: String, required: true, enum: exchangeNameList },
    symbol: { type: String, required: true },
    timeframe: { type: String, required: true, enum: timeframeList },
    openTimestamp: { type: Date, required: true },
    closeTimestamp: { type: Date, required: true },
    open: { type: Number, required: true },
    close: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    volume: { type: Number, required: true },
    quoteAssetVolume: { type: Number, required: true },
    takerBuyBaseAssetVolume: { type: Number, required: true },
    takerBuyQuoteAssetVolume: { type: Number, required: true },
    numTrades: { type: Number, required: true },
  };
  const indexes: IndexDefinition = { exchange: 1, name: 1, timeframe: 1, closeTimestamp: 1 };

  return pipe(
    ioe.tryCatch(
      () => new client.Schema<KlineDocument>(mongooseSchema).index(indexes),
      createErrorFromUnknown(
        createKlineDaoError('BuildDaoFailed', 'Creating a Mongoose model schema for kline failed'),
      ),
    ),
    ioe.chain((schema) =>
      ioe.tryCatch(
        () => client.model(klineModelName, schema),
        createErrorFromUnknown(
          createKlineDaoError('BuildDaoFailed', 'Creating a Mongoose model for kline failed'),
        ),
      ),
    ),
  );
}
