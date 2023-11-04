import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { isNotNil, omit } from 'ramda';

import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { BtStrategyId, BtStrategyModel } from '../dataModels/btStrategy.js';
import { BtStrategyDaoError, createBtStrategyDaoError } from './btStrategy.error.js';
import { BtStrategyMongooseModel } from './btStrategy.js';

export type AddBtStrategy = (btStrategy: BtStrategyModel) => te.TaskEither<AddBtStrategyErr, void>;
export type AddBtStrategyErr = BtStrategyDaoError<'AddFailed'>;
export function addBtStrategyModel({
  mongooseModel,
}: {
  mongooseModel: BtStrategyMongooseModel;
}): AddBtStrategy {
  return (btStrategy) =>
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

export type GetBtStrategies = te.TaskEither<GetBtStrategiesErr, readonly BtStrategyModel[]>;
export type GetBtStrategiesErr = BtStrategyDaoError<'GetBtStrategiesFailed'>;
export function getBtStrategies({
  mongooseModel,
}: {
  mongooseModel: BtStrategyMongooseModel;
}): GetBtStrategies {
  return pipe(
    te.tryCatch(
      () => mongooseModel.find().lean(),
      createErrorFromUnknown(
        createBtStrategyDaoError('GetBtStrategiesFailed', 'Getting backtesting strategies failed'),
      ),
    ),
    te.map((btStrategies) =>
      btStrategies.map((btStrategy) =>
        omit(['_id', '__v'], { ...btStrategy, id: btStrategy._id as BtStrategyId }),
      ),
    ),
  );
}

export type UpdateBtStrategyById = (
  id: string,
  updateTo: Partial<BtStrategyModel>,
) => te.TaskEither<UpdateBtStrategyByIdErr, void>;
export type UpdateBtStrategyByIdErr = BtStrategyDaoError<'NotExist' | 'UpdateByIdFailed'>;
export function updateBtStrategyById({
  mongooseModel,
}: {
  mongooseModel: BtStrategyMongooseModel;
}): UpdateBtStrategyById {
  return (id, updateTo) =>
    pipe(
      te.tryCatch(
        () => mongooseModel.updateOne({ _id: id }, { ...updateTo, $inc: { version: 1 } }),
        createErrorFromUnknown(
          createBtStrategyDaoError('UpdateByIdFailed', 'Updating backtesting strategy by ID failed'),
        ),
      ),
      te.chainEitherKW(({ matchedCount }) =>
        matchedCount === 0
          ? e.left(
              createBtStrategyDaoError(
                'NotExist',
                `Backtesting strategy (${id}) cannot be updated b/c it does not exist`,
              ),
            )
          : e.right(undefined),
      ),
    );
}
