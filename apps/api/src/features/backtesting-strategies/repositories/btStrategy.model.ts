import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Model, Mongoose, SchemaDefinition } from 'mongoose';
import { values } from 'ramda';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange.js';
import { languageEnum } from '#shared/domain/language.js';
import { timeframeEnum } from '#shared/domain/timeframe.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { BtStrategy, executionStatusEnum } from '../domain/btStrategy.entity.js';
import { BtStrategyRepoError, createBtStrategyRepoError } from './btStrategy.error.js';

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
  language: { type: String, required: true, enum: values(languageEnum) },
  body: { type: String, required: true },
  executionStatus: { type: String, required: true, enum: values(executionStatusEnum) },
  version: { type: Number, required: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
};

export function createBtStrategyModel(
  client: Mongoose,
): ioe.IOEither<BtStrategyRepoError<'CreateBtStrategyRepoError'>, BtStrategyModel> {
  return pipe(
    ioe.tryCatch(
      () => new client.Schema<BtStrategyDoc>(btStrategyModelSchema),
      createErrorFromUnknown(
        createBtStrategyRepoError(
          'CreateBtStrategyRepoError',
          'Creating a model schema for backtesting strategy by Mongoose failed',
        ),
      ),
    ),
    ioe.chain((schema) =>
      ioe.tryCatch(
        () => client.model<BtStrategyDoc>(btStrategyModelName, schema),
        createErrorFromUnknown(
          createBtStrategyRepoError(
            'CreateBtStrategyRepoError',
            'Creating a model for backtesting strategy by Mongoose failed',
          ),
        ),
      ),
    ),
  );
}
