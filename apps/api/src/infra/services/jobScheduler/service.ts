import { Agenda } from 'agenda';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { getJobSchedulerConfig } from './config.js';
import { addBtJob } from './jobs/backtesting.js';
import { JobSchedulerError, createJobSchedulerError } from './service.error.js';
import { JobScheduler } from './service.type.js';

export function createJobScheduler(): te.TaskEither<JobSchedulerError<'CreateServiceFailed'>, JobScheduler> {
  const { URI, COLLECTION_NAME } = getJobSchedulerConfig();

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
    te.map((agenda) => ({ stop: stopSerive(agenda), addBtJob: addBtJob(agenda) })),
  );
}

function stopSerive(agenda: Agenda): JobScheduler['stop'] {
  return te.tryCatch(
    async () => {
      await agenda.stop();
      await agenda.close();
    },
    createErrorFromUnknown(
      createJobSchedulerError('StopServiceFailed', 'Stopping job scheduler service failed'),
    ),
  );
}
