import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';
import { nanoid } from 'nanoid';

import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { BtStrategyId } from '../domain/btStrategy.entity.js';
import { BtStrategyRepoError, createBtStrategyRepoError } from './btStrategy.error.js';
import { BtStrategyModel, createBtStrategyModel } from './btStrategy.model.js';
import { BtStrategyRepo } from './btStrategy.type.js';

export function createBtStrategyRepo(
  client: Mongoose,
): ioe.IOEither<BtStrategyRepoError<'CreateBtStrategyRepoError'>, BtStrategyRepo> {
  return pipe(
    createBtStrategyModel(client),
    ioe.map((model) => ({ generateId: () => nanoid() as BtStrategyId, add: addBtStrategy(model) })),
  );
}

function addBtStrategy(model: BtStrategyModel): BtStrategyRepo['add'] {
  return (btStrategy) =>
    pipe(
      te.tryCatch(
        () => model.create(btStrategy),
        createErrorFromUnknown(
          createBtStrategyRepoError('AddBtStrategyError', 'Adding a backtesting strategy to MongoDb failed'),
        ),
      ),
      te.asUnit,
    );
}
