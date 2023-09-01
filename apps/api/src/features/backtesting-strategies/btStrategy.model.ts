import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Model, Mongoose, SchemaDefinition } from 'mongoose';
import { values } from 'ramda';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange.js';
import { timeframeEnum } from '#shared/domain/timeframe.js';
import { createErrorFromUnknown } from '#shared/error.js';

import { CreateBtStrategyRepoError } from './btStrategy.repository.type.js';
import { BtStrategy } from './domain/btStrategy.entity.js';

export const btStrategyModelName = 'BtStrategy';

type BtStrategyDoc = BtStrategy & { _id: string; __v: number };
export type BtStrategyModel = Model<BtStrategyDoc>;

const btStrategyModelSchema: SchemaDefinition<BtStrategyDoc> = {
  _id: { type: String, alias: 'id', required: true },
  name: { type: String, required: true },
  exchange: { type: String, required: true, enum: values(exchangeNameEnum) },
  symbol: { type: String, required: true },
  currency: { type: String, required: true },
  timeframe: { type: String, required: true, enum: values(timeframeEnum) },
  initialCapital: { type: Number, required: true },
  takerFeeRate: { type: Number, required: true },
  makerFeeRate: { type: Number, required: true },
  maxNumKlines: { type: Number, required: true },
  startTimestamp: { type: Date, required: true },
  endTimestamp: { type: Date, required: true },
  body: { type: String, required: true },
  version: { type: Number, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
};

export function createBtStrategyModel(
  client: Mongoose,
): ioe.IOEither<CreateBtStrategyRepoError, BtStrategyModel> {
  return pipe(
    ioe.tryCatch(
      () => new client.Schema<BtStrategyDoc>(btStrategyModelSchema),
      createErrorFromUnknown(CreateBtStrategyRepoError, 'CREATE_SCHEMA_ERROR'),
    ),
    ioe.chain((schema) =>
      ioe.tryCatch(
        () => client.model<BtStrategyDoc>(btStrategyModelName, schema),
        createErrorFromUnknown(CreateBtStrategyRepoError, 'CREATE_MODEL_ERROR'),
      ),
    ),
  );
}
