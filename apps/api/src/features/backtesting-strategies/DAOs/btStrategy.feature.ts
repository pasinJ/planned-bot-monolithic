import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { nanoid } from 'nanoid';
import { isNotNil, omit } from 'ramda';

import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { BtStrategyId, BtStrategyModel } from '../data-models/btStrategy.js';
import { BtStrategyDaoError, createBtStrategyDaoError } from './btStrategy.error.js';
import { BtStrategyMongooseModel } from './btStrategy.js';

export const generateBtStrategyModelId: io.IO<BtStrategyId> = () => nanoid() as BtStrategyId;

export function addBtStrategyModel({ mongooseModel }: { mongooseModel: BtStrategyMongooseModel }) {
  return (btStrategy: BtStrategyModel): te.TaskEither<BtStrategyDaoError<'AddFailed'>, void> =>
    pipe(
      te.tryCatch(
        () => mongooseModel.create(btStrategy),
        createErrorFromUnknown(createBtStrategyDaoError('AddFailed', 'Adding a backtesting strategy failed')),
      ),
      te.asUnit,
    );
}

export function existBtStrategyModelById({ mongooseModel }: { mongooseModel: BtStrategyMongooseModel }) {
  return (id: string): te.TaskEither<BtStrategyDaoError<'ExistByIdFailed'>, boolean> =>
    pipe(
      te.tryCatch(
        () => mongooseModel.exists({ _id: id }),
        createErrorFromUnknown(
          createBtStrategyDaoError(
            'ExistByIdFailed',
            'Checking existence of backtesting strateby by ID failed',
          ),
        ),
      ),
      te.map(isNotNil),
    );
}

export function getBtStrategyModelById({ mongooseModel }: { mongooseModel: BtStrategyMongooseModel }) {
  return (id: string): te.TaskEither<BtStrategyDaoError<'GetByIdFailed' | 'NotExist'>, BtStrategyModel> =>
    pipe(
      te.tryCatch(
        () => mongooseModel.findById(id).lean(),
        createErrorFromUnknown(
          createBtStrategyDaoError('GetByIdFailed', 'Getting backtesting strategy by ID failed'),
        ),
      ),
      te.chainEitherKW(
        e.fromPredicate(isNotNil, () =>
          createBtStrategyDaoError('NotExist', `Backtesting strategy with ID ${id} does not exist`),
        ),
      ),
      te.map((btStrategyModel) =>
        omit(['_id', '__v'], { ...btStrategyModel, id: btStrategyModel._id as BtStrategyId }),
      ),
    );
}
