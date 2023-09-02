import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';

import { createErrorFromUnknown } from '#shared/error.js';

import { BtStrategyModel, createBtStrategyModel } from './btStrategy.model.js';
import {
  AddBtStrategyError,
  BtStrategyRepo,
  CreateBtStrategyRepoError,
} from './btStrategy.repository.type.js';

export function createBtStrategyRepo(
  client: Mongoose,
): ioe.IOEither<CreateBtStrategyRepoError, BtStrategyRepo> {
  return pipe(
    createBtStrategyModel(client),
    ioe.map((model) => ({ add: addBtStrategy(model) })),
  );
}

function addBtStrategy(model: BtStrategyModel): BtStrategyRepo['add'] {
  return (btStrategy) =>
    pipe(
      te.tryCatch(() => model.create(btStrategy), createErrorFromUnknown(AddBtStrategyError)),
      te.asUnit,
    );
}
