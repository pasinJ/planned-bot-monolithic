import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { equals } from 'ramda';

import { JobSchedulerError } from '#infra/services/jobScheduler/service.error.js';
import { JobScheduler } from '#infra/services/jobScheduler/service.type.js';
import { BusinessError, createBusinessError } from '#shared/errors/businessError.js';

import { BtExecutionId } from '../data-models/btExecution.model.js';
import { BtStrategyModelDaoError } from '../data-models/btStrategy.dao.error.js';
import { BtStrategyModelDao } from '../data-models/btStrategy.dao.type.js';
import { BtStrategyId } from '../domain/btStrategy.entity.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';

export type ExecuteBtStrategyDeps = {
  btStrategyModelDao: Pick<BtStrategyModelDao, 'existById'>;
  jobScheduler: Pick<JobScheduler, 'addBtJob'>;
};
export type ExecuteBtStrategyRequest = { btStrategyId: string };

export function executeBtStrategy(
  deps: ExecuteBtStrategyDeps,
  request: ExecuteBtStrategyRequest,
): te.TaskEither<
  | BtStrategyModelDaoError<'ExistByIdFailed'>
  | BusinessError<'StrategyNotExist' | 'AlreadyScheduled'>
  | JobSchedulerError<'AddBtJobFailed' | 'ExceedJobMaxLimit'>,
  { id: BtExecutionId; createdAt: Date; progressPath: string; resultPath: string }
> {
  const { btStrategyModelDao, jobScheduler } = deps;
  const { btStrategyId } = request;
  const { GET_BT_PROGRESS, GET_BT_RESULT } = BT_STRATEGY_ENDPOINTS;

  return pipe(
    btStrategyModelDao.existById(btStrategyId),
    te.chainW(
      te.fromPredicate(equals(true), () =>
        createBusinessError('StrategyNotExist', `The backtesting strategy (${btStrategyId}) does not exist`),
      ),
    ),
    te.chainW(() => jobScheduler.addBtJob(btStrategyId as BtStrategyId)),
    te.map(({ id, createdAt }) => ({
      id,
      createdAt,
      progressPath: GET_BT_PROGRESS.url.replace(':id', btStrategyId).replace(':executionId', id),
      resultPath: GET_BT_RESULT.url.replace(':id', btStrategyId).replace(':executionId', id),
    })),
  );
}
