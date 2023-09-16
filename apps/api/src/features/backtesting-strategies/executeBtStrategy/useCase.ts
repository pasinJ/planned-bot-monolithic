import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { equals } from 'ramda';

import { JobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';

import { BtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BtExecutionId } from '../data-models/btExecution.js';
import { BtStrategyId } from '../data-models/btStrategy.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';

export type ExecuteBtStrategyDeps = {
  btStrategyDao: {
    existById: (id: string) => te.TaskEither<BtStrategyDaoError<'ExistByIdFailed'>, boolean>;
  };
  btJobScheduler: {
    scheduleBtJob: (
      btStrategyId: BtStrategyId,
    ) => te.TaskEither<
      JobSchedulerError<'ScheduleJobFailed' | 'ExceedJobMaxSchedulingLimit'>,
      { id: BtExecutionId; createdAt: Date }
    >;
  };
};
export type ExecuteBtStrategyRequest = { btStrategyId: string };

export function executeBtStrategy(
  deps: ExecuteBtStrategyDeps,
  request: ExecuteBtStrategyRequest,
): te.TaskEither<
  | BtStrategyDaoError<'ExistByIdFailed'>
  | GeneralError<'StrategyNotExist'>
  | JobSchedulerError<'ScheduleJobFailed' | 'ExceedJobMaxSchedulingLimit'>,
  { id: BtExecutionId; createdAt: Date; progressPath: string; resultPath: string }
> {
  const { btStrategyDao: btStrategyModelDao, btJobScheduler } = deps;
  const { btStrategyId } = request;
  const { GET_BT_PROGRESS, GET_BT_RESULT } = BT_STRATEGY_ENDPOINTS;

  return pipe(
    btStrategyModelDao.existById(btStrategyId),
    te.chainW(
      te.fromPredicate(equals(true), () =>
        createGeneralError('StrategyNotExist', `The backtesting strategy (${btStrategyId}) does not exist`),
      ),
    ),
    te.chainW(() => btJobScheduler.scheduleBtJob(btStrategyId as BtStrategyId)),
    te.map(({ id, createdAt }) => ({
      id,
      createdAt,
      progressPath: GET_BT_PROGRESS.url.replace(':id', btStrategyId).replace(':executionId', id),
      resultPath: GET_BT_RESULT.url.replace(':id', btStrategyId).replace(':executionId', id),
    })),
  );
}
