import { Agenda, Processor } from 'agenda';
import { fork } from 'child_process';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import fs from 'node:fs/promises';
import { join } from 'path';
import { equals, isNil, propSatisfies } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import {
  BT_PROGRESS_PERCENTAGE_START,
  BtExecutionId,
  BtExecutionStatus,
  BtProgressPercentage,
  btExecutionStatusEnum,
} from '#features/btStrategies/dataModels/btExecution.js';
import { OrdersLists, TradesLists } from '#features/shared/strategyExecutor/executeStrategy.js';
import { StrategyModule } from '#features/shared/strategyExecutorContext/strategy.js';
import { LoggerIo } from '#infra/logging.js';
import { DateService } from '#infra/services/date/service.js';
import { JobSchedulerError, createJobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { JobRecord } from '#infra/services/jobScheduler/service.js';
import { createAppError, createErrorFromUnknown } from '#shared/errors/appError.js';
import { ValidDate } from '#shared/utils/date.js';

import { BtStrategyId } from '../dataModels/btStrategy.js';
import { BtJobConfig, BtJobTimeout } from './backtesting.job.config.js';

const __dirname = new URL('.', import.meta.url).pathname;
const WORKER_ENTRY_POINT = join(__dirname, 'backtesting.job.worker');

export type BtJobDocument = JobRecord<BtJobName, BtJobData, BtJobResult<BtExecutionStatus>>;
type BtJobName = typeof btJobName;
export const btJobName = 'backtesting';
export type BtJobData = {
  id: BtExecutionId;
  btStrategyId: BtStrategyId;
  status: BtExecutionStatus;
  percentage: BtProgressPercentage;
};
export type BtJobResult<Status extends BtExecutionStatus> = Status extends 'PENDING'
  ? undefined
  : Status extends 'RUNNING' | 'TIMEOUT' | 'CANCELED' | 'INTERUPTED'
  ? { logs: string[] }
  : Status extends 'FAILED'
  ? { logs: string[]; error: { name: string; type: string; message: string; causesList: string[] } }
  : {
      logs: string[];
      strategyModule: StrategyModule;
      orders: OrdersLists;
      trades: TradesLists;
    };

export type BtJobDeps = DeepReadonly<{ getBtJobConfig: io.IO<BtJobConfig>; fork: typeof fork }>;
export type DefineBtJob = ioe.IOEither<DefineBtJobError, void>;
export type DefineBtJobError = JobSchedulerError<'DefineJobFailed'>;
export function defineBtJob(deps: BtJobDeps) {
  return ({ agenda, loggerIo }: { agenda: Agenda; loggerIo: LoggerIo }): DefineBtJob => {
    return pipe(
      ioe.Do,
      ioe.bind('config', () => ioe.fromIO(deps.getBtJobConfig)),
      ioe.let('agendaOptions', ({ config }) => ({
        concurrency: config.JOB_CONCURRENCY,
        lockLimit: config.JOB_CONCURRENCY,
        shouldSaveResult: true,
      })),
      ioe.let('processor', ({ config }) => buildBtJobProcessor(deps.fork, config.JOB_TIMEOUT_MS)),
      ioe.chain(({ agendaOptions, processor }) =>
        ioe.tryCatch(
          () => agenda.define(btJobName, agendaOptions, processor),
          createErrorFromUnknown(
            createJobSchedulerError('DefineJobFailed', 'Defining backtesting job failed'),
          ),
        ),
      ),
      ioe.chainFirstIOK(() => loggerIo.infoIo('Backtesting job was defined to a job scheduler instance')),
      ioe.orElseFirstIOK(() =>
        loggerIo.errorIo('Defining backtesting job to a job scheduler instance failed'),
      ),
    );
  };
}

function buildBtJobProcessor(fork: BtJobDeps['fork'], timeout: BtJobTimeout): Processor<BtJobData> {
  return async (job, done) => {
    const jobId = job.attrs._id;
    const executionId = job.attrs.data.id;

    try {
      job.attrs.data.status = btExecutionStatusEnum.RUNNING;
      await job.save();

      const workerPath = await fs
        .access(WORKER_ENTRY_POINT + '.js', fs.constants.R_OK)
        .then(() => WORKER_ENTRY_POINT + '.js')
        .catch(() => fs.access(WORKER_ENTRY_POINT + '.ts', fs.constants.R_OK))
        .then((workerPath) => (workerPath ? workerPath : WORKER_ENTRY_POINT + '.ts'))
        .catch(() => undefined);

      if (isNil(workerPath)) {
        job.attrs.data.status = btExecutionStatusEnum.FAILED;
        job.attrs.result = {
          ...(job.attrs.result ?? {}),
          error: createAppError({
            name: 'BtJobProcessorError',
            message: `Worker path ${WORKER_ENTRY_POINT}.(js|ts) does not exist`,
          }),
        };
      } else {
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
      }
    } catch (error) {
      job.attrs.data.status = btExecutionStatusEnum.FAILED;
      done();
    }
  };
}

export type ScheduleBtJobDeps = DeepReadonly<{
  dateService: DateService;
  btExecutionDao: { generateId: io.IO<BtExecutionId> };
}>;
export type ScheduleBtJob = (
  btStrategyId: BtStrategyId,
) => te.TaskEither<ScheduleBtJobError, Readonly<{ id: BtExecutionId; createdAt: ValidDate }>>;
export type ScheduleBtJobError = JobSchedulerError<'ScheduleJobFailed' | 'ExceedJobMaxSchedulingLimit'>;
export function scheduleBtJob(deps: ScheduleBtJobDeps) {
  return ({ agenda }: { agenda: Agenda }): ScheduleBtJob => {
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
    const checkIfThereIsPendingOrRunning = e.fromPredicate(propSatisfies(equals(0), 'length'), () =>
      createJobSchedulerError(
        'ExceedJobMaxSchedulingLimit',
        'Backtesting job can be scheduled only one at a time per strategy',
      ),
    );
    function scheduleJob(id: BtExecutionId, btStrategyId: BtStrategyId) {
      return te.tryCatch(
        () =>
          agenda.now(btJobName, {
            id,
            btStrategyId,
            status: PENDING,
            percentage: BT_PROGRESS_PERCENTAGE_START,
          }),
        createErrorFromUnknown(
          createJobSchedulerError('ScheduleJobFailed', 'Scheduling a backtesting job failed'),
        ),
      );
    }

    return (btStrategyId) =>
      pipe(
        getPendingOrRunningBtJob(agenda, btStrategyId),
        te.chainFirstEitherKW(checkIfThereIsPendingOrRunning),
        te.bind('id', () => te.fromIO(btExecutionDao.generateId)),
        te.bind('currentDate', () => te.fromIO(dateService.getCurrentDate)),
        te.chainFirstW(({ id }) => scheduleJob(id, btStrategyId)),
        te.map(({ id, currentDate }) => ({ id, createdAt: currentDate })),
      );
  };
}
