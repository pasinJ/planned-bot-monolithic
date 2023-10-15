import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { isNotNil, omit } from 'ramda';

import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { BtStrategyId, BtStrategyModel } from '../dataModels/btStrategy.js';
import { BtStrategyDaoError, createBtStrategyDaoError } from './btStrategy.error.js';
import { BtStrategyMongooseModel } from './btStrategy.js';

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

export type GetBtStrategyById = (id: string) => te.TaskEither<GetBtStrategyByIdError, BtStrategyModel>;
export type GetBtStrategyByIdError = BtStrategyDaoError<'GetByIdFailed' | 'NotExist'>;
export function getBtStrategyModelById({
  mongooseModel,
}: {
  mongooseModel: BtStrategyMongooseModel;
}): GetBtStrategyById {
  return (id) =>
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
