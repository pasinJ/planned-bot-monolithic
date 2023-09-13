import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Model, Mongoose, SchemaDefinition } from 'mongoose';
import { nanoid } from 'nanoid';
import { isNotNil, values } from 'ramda';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange.js';
import { languageEnum } from '#shared/domain/language.js';
import { timeframeEnum } from '#shared/domain/timeframe.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { BtStrategyModelDaoError, createBtStrategyModelDaoError } from './btStrategy.dao.error.js';
import { BtStrategyModelDao } from './btStrategy.dao.type.js';
import { BtStrategyId, BtStrategyModel } from './btStrategy.model.js';

export function createBtStrategyModelDao(
  client: Mongoose,
): ioe.IOEither<BtStrategyModelDaoError<'CreateDaoFailed'>, BtStrategyModelDao> {
  return pipe(
    createMongooseModel(client),
    ioe.map((model) => ({ generateId: generateId(), add: add(model), existById: existById(model) })),
  );
}

type BtStrategyDocument = BtStrategyModel & { _id: string; __v: number };
export type BtStrategyMongooseModel = Model<BtStrategyDocument>;
export const btStrategyModelName = 'BtStrategy';

function createMongooseModel(
  client: Mongoose,
): ioe.IOEither<BtStrategyModelDaoError<'CreateDaoFailed'>, BtStrategyMongooseModel> {
  const mongooseSchema: SchemaDefinition<BtStrategyDocument> = {
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
    version: { type: Number, required: true },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  };

  return pipe(
    ioe.tryCatch(
      () => new client.Schema<BtStrategyDocument>(mongooseSchema),
      createErrorFromUnknown(
        createBtStrategyModelDaoError(
          'CreateDaoFailed',
          'Creating a Mongoose model schema for backtesting strategy failed',
        ),
      ),
    ),
    ioe.chain((schema) =>
      ioe.tryCatch(
        () => client.model<BtStrategyDocument>(btStrategyModelName, schema),
        createErrorFromUnknown(
          createBtStrategyModelDaoError(
            'CreateDaoFailed',
            'Creating a Mongoose model for backtesting strategy failed',
          ),
        ),
      ),
    ),
  );
}

function generateId(): BtStrategyModelDao['generateId'] {
  return () => nanoid() as BtStrategyId;
}

function add(model: BtStrategyMongooseModel): BtStrategyModelDao['add'] {
  return (btStrategy) =>
    pipe(
      te.tryCatch(
        () => model.create(btStrategy),
        createErrorFromUnknown(
          createBtStrategyModelDaoError('AddFailed', 'Adding a backtesting strategy failed'),
        ),
      ),
      te.asUnit,
    );
}

function existById(model: BtStrategyMongooseModel): BtStrategyModelDao['existById'] {
  return (id: string) =>
    pipe(
      te.tryCatch(
        () => model.exists({ _id: id }),
        createErrorFromUnknown(
          createBtStrategyModelDaoError(
            'ExistByIdFailed',
            'Checking existence of backtesting strateby by ID failed',
          ),
        ),
      ),
      te.map(isNotNil),
    );
}
