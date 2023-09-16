import { Agenda, DefineOptions, Processor } from 'agenda';
import type { fork } from 'child_process';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { equals, propSatisfies } from 'ramda';

import {
  BtExecutionId,
  BtExecutionStatus,
  btExecutionStatusEnum,
} from '#features/backtesting-strategies/data-models/btExecution.js';
import { LoggerIo } from '#infra/logging.js';
import { DateService } from '#infra/services/date/service.js';
import { JobTimeout } from '#infra/services/jobScheduler/config.js';
import { JobSchedulerError, createJobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { JobRecord } from '#infra/services/jobScheduler/service.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { BtStrategyId } from '../data-models/btStrategy.js';
import { getBtJobConfig } from './backtesting.job.config.js';

export const btJobName = 'backtesting';

export type BtJobRecord = JobRecord<BtJobName, BtJobData, BtJobResult>;
type BtJobName = typeof btJobName;
export type BtJobData = { id: BtExecutionId; btStrategyId: BtStrategyId; status: BtExecutionStatus };
export type BtJobResult = { logs: string[] };

export type BtJobDeps = { fork: typeof fork };
export function defineBtJob(deps: BtJobDeps) {
  return ({
    agenda,
    loggerIo,
  }: {
    agenda: Agenda;
    loggerIo: LoggerIo;
  }): ioe.IOEither<JobSchedulerError<'DefineJobFailed'>, void> => {
    const { JOB_CONCURRENCY, JOB_TIMEOUT_MS, JOB_WORKER_PATH } = getBtJobConfig();
    const jobOptions: DefineOptions = {
      concurrency: JOB_CONCURRENCY,
      lockLimit: JOB_CONCURRENCY,
      shouldSaveResult: true,
    };

    return pipe(
      ioe.tryCatch(
        () =>
          agenda.define(
            btJobName,
            jobOptions,
            buildBtJobProcessor(deps.fork, JOB_WORKER_PATH, JOB_TIMEOUT_MS),
          ),
        createErrorFromUnknown(createJobSchedulerError('DefineJobFailed', 'Defining backtesting job failed')),
      ),
      ioe.chainFirstIOK(() => loggerIo.infoIo('Backtesting job was defined to a job scheduler instance')),
    );
  };
}

function buildBtJobProcessor(
  fork: BtJobDeps['fork'],
  workerPath: string,
  timeout: JobTimeout,
): Processor<BtJobData> {
  return async (job, done) => {
    job.attrs.data.status = btExecutionStatusEnum.running;
    await job.save();

    const executionId = job.attrs.data.id;
    const worker = fork(workerPath, [executionId], { timeout });

    worker.on('close', (exitCode) => {
      if (exitCode !== 0) {
        job.attrs.data.status = btExecutionStatusEnum.failed;
      }

      done();
    });
  };
}

export type ScheduleBtJobDeps = {
  dateService: DateService;
  btExecutionDao: { generateId: io.IO<BtExecutionId> };
};
type ScheduleBtJob = (
  btStrategyId: BtStrategyId,
) => te.TaskEither<
  JobSchedulerError<'ScheduleJobFailed' | 'ExceedJobMaxSchedulingLimit'>,
  { id: BtExecutionId; createdAt: Date }
>;
export function scheduleBtJob(deps: ScheduleBtJobDeps) {
  const { pending, running } = btExecutionStatusEnum;
  const { dateService, btExecutionDao } = deps;

  function getPendingOrRunningBtJob(agenda: Agenda, btStrategyId: string) {
    return te.tryCatch(
      () =>
        agenda.jobs({
          name: btJobName,
          'data.btStrategyId': btStrategyId,
          'data.status': { $in: [pending, running] },
        }),
      createErrorFromUnknown(
        createJobSchedulerError('ScheduleJobFailed', 'Getting pending or running job failed'),
      ),
    );
  }

  return ({ agenda }: { agenda: Agenda }): ScheduleBtJob =>
    (btStrategyId) =>
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
        te.let('data', () => ({ id: btExecutionDao.generateId(), btStrategyId, status: pending })),
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
}
