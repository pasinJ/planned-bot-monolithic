import { Agenda, DefineOptions, Processor } from 'agenda';
import type { fork } from 'child_process';
import e from 'fp-ts/lib/Either.js';

import { btExecutionStatusEnum } from '#features/backtesting-strategies/data-models/btExecution.model.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { JobTimeout, getJobSchedulerConfig } from '../../config.js';
import { JobSchedulerError, createJobSchedulerError } from '../../service.error.js';
import { BtJobData, btJobName } from './type.js';

const workerModulePath = './worker.ts';

export function defineBtJob(
  agenda: Agenda,
  deps: BtJobDeps,
): e.Either<JobSchedulerError<'DefineJobFailed'>, void> {
  const { BT_JOB_CONCURRENCY, BT_JOB_TIMEOUT_MS } = getJobSchedulerConfig();
  const jobOptions: DefineOptions = {
    concurrency: BT_JOB_CONCURRENCY,
    lockLimit: BT_JOB_CONCURRENCY,
    shouldSaveResult: true,
  };

  return e.tryCatch(
    () => agenda.define(btJobName, jobOptions, buildBtJobProcessor(deps, BT_JOB_TIMEOUT_MS)),
    createErrorFromUnknown(createJobSchedulerError('DefineJobFailed', 'Defining backtesting job failed')),
  );
}

export type BtJobDeps = { fork: typeof fork };
function buildBtJobProcessor(deps: BtJobDeps, timeout: JobTimeout): Processor<BtJobData> {
  return async (job, done) => {
    job.attrs.data.status = btExecutionStatusEnum.running;
    await job.save();

    const executionId = job.attrs.data.id;
    const worker = deps.fork(workerModulePath, [executionId], { timeout });

    worker.on('close', (exitCode) => {
      if (exitCode !== 0) job.attrs.data.status = btExecutionStatusEnum.failed;
      done();
    });
  };
}
