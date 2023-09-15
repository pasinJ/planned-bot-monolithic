import { Agenda, DefineOptions, Processor } from 'agenda';
import type { fork } from 'child_process';
import e from 'fp-ts/lib/Either.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { equals, propSatisfies } from 'ramda';

import {
  btExecutionStatusEnum,
  generateBtExecutionId,
} from '#features/backtesting-strategies/data-models/btExecution.model.js';
import { LoggerIo } from '#infra/logging.js';
import { JobTimeout } from '#infra/services/jobScheduler/config.js';
import { JobSchedulerError, createJobSchedulerError } from '#infra/services/jobScheduler/service.error.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { getBtJobConfig } from './backtesting.job.config.js';
import { BtJobData, ScheduleBtJob, btJobName } from './backtesting.job.type.js';

const workerModulePath = './worker.ts';

export type BtJobDeps = { fork: typeof fork };

export function defineBtJob(
  agenda: Agenda,
  loggerIo: LoggerIo,
  deps: BtJobDeps,
): ioe.IOEither<JobSchedulerError<'DefineJobFailed'>, void> {
  const { fork } = deps;
  const { BT_JOB_CONCURRENCY, BT_JOB_TIMEOUT_MS } = getBtJobConfig();
  const jobOptions: DefineOptions = {
    concurrency: BT_JOB_CONCURRENCY,
    lockLimit: BT_JOB_CONCURRENCY,
    shouldSaveResult: true,
  };

  return pipe(
    ioe.tryCatch(
      () => agenda.define(btJobName, jobOptions, buildBtJobProcessor(fork, BT_JOB_TIMEOUT_MS)),
      createErrorFromUnknown(createJobSchedulerError('DefineJobFailed', 'Defining backtesting job failed')),
    ),
    ioe.chainFirstIOK(() => loggerIo.infoIo('Backtesting job was defined into a job scheduler instance')),
  );
}

function buildBtJobProcessor(fork: BtJobDeps['fork'], timeout: JobTimeout): Processor<BtJobData> {
  return async (job, done) => {
    job.attrs.data.status = btExecutionStatusEnum.running;
    await job.save();

    const executionId = job.attrs.data.id;
    const worker = fork(workerModulePath, [executionId], { timeout });

    worker.on('close', (exitCode) => {
      if (exitCode !== 0) job.attrs.data.status = btExecutionStatusEnum.failed;
      done();
    });
  };
}

export function scheduleBtJob(agenda: Agenda): ScheduleBtJob {
  const { pending, running } = btExecutionStatusEnum;

  return (btStrategyId) =>
    pipe(
      te.tryCatch(
        () =>
          agenda.jobs({
            name: btJobName,
            'data.btStrategyId': btStrategyId,
            'data.status': { $in: [pending, running] },
          }),
        createErrorFromUnknown(
          createJobSchedulerError('ScheduleBtJobFailed', 'Getting pending or running job failed'),
        ),
      ),
      te.chainFirstEitherKW(
        e.fromPredicate(propSatisfies(equals(0), 'length'), () =>
          createJobSchedulerError(
            'ExceedJobMaxLimit',
            'Backtesting job can be scheduled only one at a time per strategy',
          ),
        ),
      ),
      te.let('data', () => ({
        id: generateBtExecutionId(),
        btStrategyId,
        status: btExecutionStatusEnum.pending,
      })),
      te.chainFirstW(({ data }) =>
        te.tryCatch(
          () => agenda.now(btJobName, data),
          createErrorFromUnknown(
            createJobSchedulerError('ScheduleBtJobFailed', 'Adding a backtesting job failed'),
          ),
        ),
      ),
      te.map(({ data }) => ({ id: data.id, createdAt: new Date() })),
    );
}
