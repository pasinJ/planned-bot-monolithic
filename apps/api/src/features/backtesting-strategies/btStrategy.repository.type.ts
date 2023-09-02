import te from 'fp-ts/lib/TaskEither.js';

import { CustomError, ExternalError } from '#shared/error.js';

import { BtStrategy } from './domain/btStrategy.entity.js';

export type BtStrategyRepo = {
  add: (btStrategy: BtStrategy) => te.TaskEither<AddBtStrategyError, void>;
};

export class CreateBtStrategyRepoError extends CustomError<
  'CREATE_SCHEMA_ERROR' | 'CREATE_MODEL_ERROR' | 'CREATE_REPO_ERROR',
  ExternalError
>('CREATE_REPO_ERROR', 'Error happened when try to create a backtesting strategy repository') {}

export class AddBtStrategyError extends CustomError<'ADD_BT_STRATEGY_ERROR', ExternalError>(
  'ADD_BT_STRATEGY_ERROR',
  'Error happened when try to add a backtesting strategy',
) {}
