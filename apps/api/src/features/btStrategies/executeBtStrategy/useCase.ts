import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { equals } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { JobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';

import { BtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BtExecutionId } from '../dataModels/btExecution.js';
import { BtStrategyId } from '../dataModels/btStrategy.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { ScheduleBtJob } from './backtesting.job.js';

export type ExecuteBtStrategyDeps = DeepReadonly<{
  btStrategyDao: { existById: (id: string) => te.TaskEither<BtStrategyDaoError<'ExistByIdFailed'>, boolean> };
  btJobScheduler: { scheduleBtJob: ScheduleBtJob };
}>;
export type ExecuteBtStrategyRequest = Readonly<{ btStrategyId: string }>;

export function executeBtStrategy(
  deps: ExecuteBtStrategyDeps,
  request: ExecuteBtStrategyRequest,
): te.TaskEither<
  | BtStrategyDaoError<'ExistByIdFailed'>
  | GeneralError<'StrategyNotExist'>
  | JobSchedulerError<'ScheduleJobFailed' | 'ExceedJobMaxSchedulingLimit'>,
  Readonly<{ id: BtExecutionId; createdAt: ValidDate; progressPath: string; resultPath: string }>
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
