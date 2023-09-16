import io from 'fp-ts/lib/IO.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';

import { HttpServerError } from '#infra/http/server.error.js';
import { HttpServer } from '#infra/http/server.js';
import { LoggerIo } from '#infra/logging.js';
import { MongoDbClientError } from '#infra/mongoDb/client.error.js';
import { disconnectMongoDbClient } from '#infra/mongoDb/client.js';
import { JobSchedulerError } from '#infra/services/jobScheduler/error.js';
import { JobScheduler } from '#infra/services/jobScheduler/service.js';
import { GracefulPeriodMs, getAppConfig } from '#shared/app.config.js';
import { executeT } from '#shared/utils/fp.js';

type ShutdownDeps = { httpServer: HttpServer; mongoDbClient: Mongoose; jobScheduler: JobScheduler };

export function addGracefulShutdown(deps: ShutdownDeps, logger: LoggerIo): io.IO<void> {
  let shutdownProcessStarted = false;

  return () => {
    ['SIGTERM', 'SIGINT'].forEach((signal) => {
      process.on(signal, () => {
        void pipe(
          t.fromIO(logger.infoIo(`Got ${signal} signal`)),
          t.chain(() => {
            if (!shutdownProcessStarted) {
              shutdownProcessStarted = true;
              return startGracefulShutdown(deps, logger);
            } else {
              return te.of(undefined);
            }
          }),
          executeT,
        );
      });
    });

    process.on('uncaughtException', (error, origin) => {
      void pipe(
        t.fromIO(logger.errorIo({ error, origin }, 'Got uncaughtException event')),
        t.chain(() => {
          if (!shutdownProcessStarted) {
            shutdownProcessStarted = true;
            return startGracefulShutdown(deps, logger);
          } else {
            return te.of(undefined);
          }
        }),
        executeT,
      );
    });

    process.on('unhandledRejection', (reason) => {
      void pipe(
        t.fromIO(logger.errorIo({ reason }, 'Got unhandledRejection event')),
        t.chain(() => {
          if (!shutdownProcessStarted) {
            shutdownProcessStarted = true;
            return startGracefulShutdown(deps, logger);
          } else {
            return te.of(undefined);
          }
        }),
        executeT,
      );
    });
  };
}

function startGracefulShutdown(deps: ShutdownDeps, logger: LoggerIo): t.Task<never> {
  const { httpServer, mongoDbClient, jobScheduler } = deps;
  const { GRACEFUL_PERIOD_MS } = getAppConfig();

  return pipe(
    te.fromIO(logger.infoIo('Graceful shutdown start')),
    te.map(() => startForceExitTimer(logger, GRACEFUL_PERIOD_MS)),
    te.chainFirstW(() =>
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      te.sequenceArray<void, HttpServerError<'StopServerFailed'> | JobSchedulerError<'StopServiceFailed'>>([
        httpServer.stop,
        jobScheduler.stop,
      ]),
    ),
    te.chainFirstW(() =>
      // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
      te.sequenceArray<void, MongoDbClientError<'DisconnectFailed'>>([
        disconnectMongoDbClient(mongoDbClient, logger),
      ]),
    ),
    te.matchE(
      (error) =>
        pipe(
          logger.errorIo({ error }, `Graceful shutdown failed: %s`, error.toString()),
          io.map(() => process.exit(1)),
          t.fromIO,
        ),
      (timer) =>
        pipe(
          () => clearTimeout(timer),
          io.chain(() => logger.infoIo('Graceful shutdown done')),
          io.map(() => process.exit(0)),
          t.fromIO,
        ),
    ),
  );
}

function startForceExitTimer(logger: LoggerIo, GRACEFUL_PERIOD_MS: GracefulPeriodMs) {
  return setTimeout(
    pipe(
      logger.errorIo(`Graceful shutdown timeout after ${GRACEFUL_PERIOD_MS} ms`),
      io.map(() => process.exit(1)),
    ),
    GRACEFUL_PERIOD_MS,
  );
}
