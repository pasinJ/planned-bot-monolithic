import ioe from 'fp-ts/lib/IOEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Model, Mongoose, Schema, SchemaDefinition } from 'mongoose';

import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { btExecutionStatusList } from '../dataModels/btExecution.js';
import { BtJobDocument } from '../executeBtStrategy/backtesting.job.js';
import { BtExecutionDaoError, createBtExecutionDaoError } from './btExecution.error.js';

type BtExecutionDocument = BtJobDocument;
export type BtExecutionMongooseModel = Model<BtExecutionDocument>;
export const btExecutionModelName = 'BtExecution';

export type BtExecutionDao = Readonly<{
  composeWith: <R>(fn: (internal: { mongooseModel: BtExecutionMongooseModel }) => R) => R;
}>;

type BuildBtExecutionDaoError = BtExecutionDaoError<'BuildDaoFailed'>;

export function buildBtExecutionDao(
  client: Mongoose,
  agendaCollection: string,
): ioe.IOEither<BuildBtExecutionDaoError, BtExecutionDao> {
  return pipe(
    createMongooseModel(client, agendaCollection),
    ioe.map((mongooseModel) => ({ composeWith: (fn) => fn({ mongooseModel }) })),
  );
}

function createMongooseModel(
  client: Mongoose,
  agendaCollection: string,
): ioe.IOEither<BuildBtExecutionDaoError, BtExecutionMongooseModel> {
  const mongooseSchema: SchemaDefinition<BtExecutionDocument> = {
    _id: { type: String, alias: 'id', required: true },
    name: { type: String, required: true },
    data: {
      id: { type: String, required: true },
      btStrategyId: { type: String, required: true },
      status: { type: String, required: true, enum: btExecutionStatusList },
      percentage: { type: Number, required: true },
    },
    result: {
      logs: { type: [String] },
      strategyModule: { type: Schema.Types.Mixed },
      orders: { type: Schema.Types.Mixed },
      trades: { type: Schema.Types.Mixed },
    },
    lastRunAt: Date,
    failReason: String,
    lastFinishedAt: Date,
  };

  return pipe(
    ioe.tryCatch(
      () => new client.Schema<BtExecutionDocument>(mongooseSchema, { collection: agendaCollection }),
      createErrorFromUnknown(
        createBtExecutionDaoError(
          'BuildDaoFailed',
          'Creating a Mongoose model schema for backtesting execution failed',
        ),
      ),
    ),
    ioe.chain((schema) =>
      ioe.tryCatch(
        () => client.model(btExecutionModelName, schema),
        createErrorFromUnknown(
          createBtExecutionDaoError(
            'BuildDaoFailed',
            'Creating a Mongoose model for backtesting execution failed',
          ),
        ),
      ),
    ),
  );
}
