import { Agenda } from 'agenda';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Logger } from 'pino';

import { LoggerIo, createLoggerIo } from '#infra/logging.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { getJobSchedulerConfig } from './config.js';
import { JobSchedulerError, createJobSchedulerError } from './service.error.js';
import { JobScheduler } from './service.type.js';

export type JobSchedulerDeps = { mainLogger: Logger };
export function createJobScheduler(
  deps: JobSchedulerDeps,
): te.TaskEither<JobSchedulerError<'CreateServiceFailed' | 'DefineJobFailed'>, JobScheduler> {
  const { URI, COLLECTION_NAME } = getJobSchedulerConfig();
  const loggerIo = createLoggerIo('JobScheduler', deps.mainLogger);

  return pipe(
    te.tryCatch(
      async () => {
        const agenda = new Agenda({ db: { address: URI, collection: COLLECTION_NAME } });
        await agenda.start();
        return agenda;
      },
      createErrorFromUnknown(
        createJobSchedulerError('CreateServiceFailed', 'Creating job scheduler service failed'),
      ),
    ),
    te.chainFirstIOK(() => loggerIo.infoIo('Job scheduler created')),
    te.map((agenda) => ({ agenda, loggerIo, stop: stopSerive(agenda, loggerIo) })),
  );
}

function stopSerive(agenda: Agenda, loggerIo: LoggerIo): JobScheduler['stop'] {
  return pipe(
    te.tryCatch(
      async () => {
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
