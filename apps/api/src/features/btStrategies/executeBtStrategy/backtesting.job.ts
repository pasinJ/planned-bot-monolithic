import { Agenda, Processor } from 'agenda';
import type { fork } from 'child_process';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { equals, propSatisfies } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import {
  BtExecutionId,
  BtExecutionProgressPercentage,
  BtExecutionStatus,
  btExecutionStatusEnum,
} from '#features/btStrategies/dataModels/btExecution.js';
import { OrdersLists, TradesLists } from '#features/shared/strategyExecutor/service.js';
import { StrategyModule } from '#features/shared/strategyExecutorModules/strategy.js';
import { LoggerIo } from '#infra/logging.js';
import { DateService } from '#infra/services/date/service.js';
import { JobSchedulerError, createJobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { JobRecord } from '#infra/services/jobScheduler/service.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';
import { ValidDate } from '#shared/utils/date.js';

import { BtStrategyId } from '../dataModels/btStrategy.js';
import { BtJobConfig, BtJobTimeout, BtWorkerModulePath } from './backtesting.job.config.js';

export type BtJobRecord = JobRecord<BtJobName, BtJobData, BtJobResult>;
type BtJobName = typeof btJobName;
export const btJobName = 'backtesting';
export type BtJobData = {
  id: BtExecutionId;
  btStrategyId: BtStrategyId;
  status: BtExecutionStatus;
  percentage: BtExecutionProgressPercentage;
};
export type BtJobResult = {
  logs: string[];
  strategyModule?: StrategyModule;
  orders?: OrdersLists;
  trades?: TradesLists;
};

export type BtJobDeps = DeepReadonly<{ fork: typeof fork; getBtJobConfig: io.IO<BtJobConfig> }>;
export function defineBtJob(deps: BtJobDeps) {
  return ({
    agenda,
    loggerIo,
  }: {
    agenda: Agenda;
    loggerIo: LoggerIo;
  }): ioe.IOEither<JobSchedulerError<'DefineJobFailed'>, void> => {
    return pipe(
      ioe.fromIO(deps.getBtJobConfig),
      ioe.chain(({ JOB_CONCURRENCY, JOB_TIMEOUT_MS, JOB_WORKER_MODULE_PATH }) =>
        ioe.tryCatch(
          () =>
            agenda.define(
              btJobName,
              { concurrency: JOB_CONCURRENCY, lockLimit: JOB_CONCURRENCY, shouldSaveResult: true },
              buildBtJobProcessor(deps.fork, JOB_WORKER_MODULE_PATH, JOB_TIMEOUT_MS),
            ),
          createErrorFromUnknown(
            createJobSchedulerError('DefineJobFailed', 'Defining backtesting job failed'),
          ),
        ),
      ),
      ioe.chainFirstIOK(() => loggerIo.infoIo('Backtesting job was defined to a job scheduler instance')),
    );
  };
}

function buildBtJobProcessor(
  fork: BtJobDeps['fork'],
  workerPath: BtWorkerModulePath,
  timeout: BtJobTimeout,
): Processor<BtJobData> {
  return async (job, done) => {
    const jobId = job.attrs._id;
    const executionId = job.attrs.data.id;

    job.attrs.data.status = btExecutionStatusEnum.RUNNING;
    await job.save();

    const worker = fork(workerPath, [executionId], { timeout });

    worker.on('close', (exitCode) => {
      if (exitCode !== 0) {
        job.attrs.data.status = btExecutionStatusEnum.FAILED;
        done();
      } else {
        void job.agenda._collection
          .findOne<{ _id: string; data: BtJobData }>({ _id: jobId }, { projection: { data: 1 } })
          .then((refreshedJob) => {
            if (refreshedJob) job.attrs.data = refreshedJob.data;
            return;
          })
          .finally(() => done());
      }
    });
  };
}

export type ScheduleBtJobDeps = DeepReadonly<{
  dateService: DateService;
  btExecutionDao: { generateId: io.IO<BtExecutionId> };
}>;
export function scheduleBtJob(deps: ScheduleBtJobDeps) {
  const { PENDING, RUNNING } = btExecutionStatusEnum;
  const { dateService, btExecutionDao } = deps;

  function getPendingOrRunningBtJob(agenda: Agenda, btStrategyId: string) {
    return te.tryCatch(
      () =>
        agenda.jobs({
          name: btJobName,
          'data.btStrategyId': btStrategyId,
          'data.status': { $in: [PENDING, RUNNING] },
        }),
      createErrorFromUnknown(
        createJobSchedulerError('ScheduleJobFailed', 'Getting pending or running job failed'),
      ),
    );
  }

  return ({ agenda }: { agenda: Agenda }) => {
    return (
      btStrategyId: BtStrategyId,
    ): te.TaskEither<
      JobSchedulerError<'ScheduleJobFailed' | 'ExceedJobMaxSchedulingLimit'>,
      Readonly<{ id: BtExecutionId; createdAt: ValidDate }>
    > =>
      pipe(
        getPendingOrRunningBtJob(agenda, btStrategyId),
        te.chainFirstEitherKW(
          e.fromPredicate(propSatisfies(equals(0), 'length'), () =>
            createJobSchedulerError(
              'ExceedJobMaxSchedulingLimit',
              'Backtesting job can be scheduled only one at a time per strategy',
            ),
          ),
        ),
        te.let('data', () => ({
          id: btExecutionDao.generateId(),
          btStrategyId,
          status: PENDING,
          percentage: 0,
        })),
        te.chainFirstW(({ data }) =>
          te.tryCatch(
            () => agenda.now(btJobName, data),
            createErrorFromUnknown(
              createJobSchedulerError('ScheduleJobFailed', 'Adding a backtesting job failed'),
            ),
          ),
        ),
        te.map(({ data }) => ({ id: data.id, createdAt: dateService.getCurrentDate() })),
      );
  };
}
