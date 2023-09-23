import { Agenda } from 'agenda';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Logger } from 'pino';

import { LoggerIo, createLoggerIo } from '#infra/logging.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { getJobSchedulerConfig } from './config.js';
import { JobSchedulerError, createJobSchedulerError } from './error.js';

export type JobScheduler = Readonly<{
  composeWith: <R>(fn: (internal: { agenda: Agenda; loggerIo: LoggerIo }) => R) => R;
  start: te.TaskEither<JobSchedulerError<'StartServiceFailed'>, void>;
  stop: te.TaskEither<JobSchedulerError<'StopServiceFailed'>, void>;
}>;

export type JobSchedulerDeps = Readonly<{ mainLogger: Logger }>;
export function buildJobScheduler(
  deps: JobSchedulerDeps,
): te.TaskEither<JobSchedulerError<'CreateServiceFailed' | 'DefineJobFailed'>, JobScheduler> {
  const { URI, COLLECTION_NAME } = getJobSchedulerConfig();
  const loggerIo = createLoggerIo('JobScheduler', deps.mainLogger);

  return pipe(
    e.tryCatch(
      () => new Agenda({ db: { address: URI, collection: COLLECTION_NAME } }),
      createErrorFromUnknown(
        createJobSchedulerError('CreateServiceFailed', 'Creating job scheduler service failed'),
      ),
    ),
    te.fromEither,
    te.chainFirstIOK(() => loggerIo.infoIo('Job scheduler created')),
    te.map((agenda) => ({
      composeWith: (fn) => fn({ agenda, loggerIo }),
      start: start({ agenda, loggerIo }),
      stop: stop({ agenda, loggerIo }),
    })),
  );
}

function start({ agenda, loggerIo }: { agenda: Agenda; loggerIo: LoggerIo }): JobScheduler['start'] {
  return pipe(
    te.tryCatch(
      () => agenda.start(),
      createErrorFromUnknown(
        createJobSchedulerError('StartServiceFailed', 'Starting job scheduler service failed'),
      ),
    ),
    te.chainFirstIOK(() => loggerIo.infoIo('Job scheduler started')),
    te.asUnit,
  );
}

function stop({ agenda, loggerIo }: { agenda: Agenda; loggerIo: LoggerIo }): JobScheduler['stop'] {
  return pipe(
    te.tryCatch(
      async () => {
        await agenda._ready;
        await agenda.stop();
        await agenda.close();
      },
      createErrorFromUnknown(
        createJobSchedulerError('StopServiceFailed', 'Stopping job scheduler service failed'),
      ),
    ),
    te.chainFirstIOK(() => loggerIo.infoIo('Job scheduler stopped')),
  );
}

export type JobRecord<
  Name extends string = string,
  Data extends Record<string, unknown> = Record<string, unknown>,
  Result = unknown,
> = {
  _id: string;
  name: Name;
  data: Data;
  priority: 20 | 10 | 0 | -10 | -20 | string;
  type: 'single' | 'normal';
  disabled?: boolean;
  shouldSaveResult?: boolean;
  result?: Result;
  nextRunAt?: Date;
  lockedAt?: Date;
  lastRunAt?: Date;
  lastFinishedAt?: Date;
  failReason?: string;
  failCount?: number;
  failedAt?: Date;
  lastModifiedBy?: string;
  __v: number;
};
