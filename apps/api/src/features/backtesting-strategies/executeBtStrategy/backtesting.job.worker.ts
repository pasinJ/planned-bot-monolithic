import { Agenda, Job } from 'agenda';
import consoleStamp from 'console-stamp';
import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Stream } from 'stream';

import { btExecutionStatusEnum } from '#features/backtesting-strategies/data-models/btExecution.js';
import { wrapLogger } from '#infra/logging.js';
import { getJobSchedulerConfig } from '#infra/services/jobScheduler/config.js';
import { executeT } from '#shared/utils/fp.js';

import { BtJobData, btJobName } from './backtesting.job.js';

function startAgenda(): te.TaskEither<void, Agenda> {
  return te.tryCatch(
    async () => {
      const { URI, COLLECTION_NAME } = getJobSchedulerConfig();
      const agenda = new Agenda({ db: { address: URI, collection: COLLECTION_NAME } });
      await agenda.start();
      return agenda;
    },
    () => process.exit(1),
  );
}
function getCurrentJobById(agenda: Agenda): te.TaskEither<void, Job<BtJobData>> {
  return te.tryCatch(
    async () => {
      const job = await agenda.jobs({
        name: btJobName,
        'data.id': executionId,
        'data.status': btExecutionStatusEnum.running,
      });
      if (job.length === 0) throw Error('Given job ID does not exist or is not running');
      else return job.at(0) as Job<BtJobData>;
    },
    () => process.exit(1),
  );
}
function addProcessSignalHandlers({ job, agenda }: { job: Job<BtJobData>; agenda: Agenda }): io.IO<void> {
  return () => {
    ['SIGTERM', 'SIGINT'].map((s) =>
      process.once(s, (signal) => {
        logger.warn(`Woker process receive ${signal} signal`);

        if (signal === 'SIGTERM') {
          job.attrs.data.status = btExecutionStatusEnum.timeout;
        } else {
          job.attrs.data.status = btExecutionStatusEnum.interupted;
        }
        job.attrs.result = { logs };

        void saveJobThenStopAgenda({ job, agenda });
      }),
    );
    process.on('uncaughtException', (error, origin) => {
      logger.error(`Uncaught exception happened (origin: ${origin})`);
      logger.error(error);

      job.attrs.data.status = btExecutionStatusEnum.failed;
      job.attrs.result = { logs };

      void saveJobThenStopAgenda({ job, agenda });
    });
    process.on('unhandledRejection', (error) => {
      logger.error(`Unhandled rejection happened`);
      logger.error(error);

      job.attrs.data.status = btExecutionStatusEnum.failed;
      job.attrs.result = { logs };

      void saveJobThenStopAgenda({ job, agenda });
    });
  };
}
async function saveJobThenStopAgenda({ job, agenda }: { job: Job<BtJobData>; agenda: Agenda }) {
  const stopAgenda = async () => {
    await agenda.stop();
    await agenda.close();
  };

  return job
    .save()
    .then(
      () => stopAgenda(),
      () => stopAgenda(),
    )
    .finally(() => process.exit(0));
}
function handleSuccessfulProcess({ job, agenda }: { job: Job<BtJobData>; agenda: Agenda }) {
  return te.tryCatch(
    async () => {
      loggerIo.info(`Backtesting process done`);

      job.attrs.data.status = btExecutionStatusEnum.finished;
      job.attrs.result = { logs };

      return saveJobThenStopAgenda({ job, agenda });
    },
    () => process.exit(1),
  );
}

// eslint-disable-next-line no-console
const logger = new console.Console(new Stream.Writable());
const logs: string[] = [];
const executionId = process.argv[2];

consoleStamp.default(logger, {
  stdout: new Stream.Writable({
    write: (chunk: Buffer, _, cb) => {
      logs.push(chunk.toString().replace(/\n$/, ''));
      cb();
    },
  }) as NodeJS.WriteStream,
});

const loggerIo = wrapLogger(logger);

await executeT(
  pipe(
    te.fromIO(loggerIo.infoIo(`Worker process for backtesting job (id:${executionId}) started`)),
    te.bindW('agenda', () => startAgenda()),
    te.bindW('job', ({ agenda }) => getCurrentJobById(agenda)),
    te.chainFirstIOK(({ job, agenda }) => addProcessSignalHandlers({ job, agenda })),
    te.chainW(({ job, agenda }) => handleSuccessfulProcess({ job, agenda })),
  ),
);
