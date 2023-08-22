import io from 'fp-ts/lib/IO.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';

import { closeHttpServer } from '#infra/http/server.js';
import { FastifyServer } from '#infra/http/server.type.js';
import { LoggerIO } from '#infra/logging.js';
import { disconnectMongoDbClient } from '#infra/mongoDb/client.js';
import { GracefulPeriodMs, getAppConfig } from '#shared/config/app.js';
import { getErrorSummary } from '#shared/error.js';
import { executeT } from '#shared/utils/fp.js';

type Deps = { server: FastifyServer; mongoDbClient: Mongoose };

export function addGracefulShutdown(deps: Deps, loggerIo: LoggerIO): io.IO<void> {
  return () => {
    ['SIGTERM', 'SIGINT'].forEach((signal) => {
      process.on(signal, () => {
        void pipe(
          t.fromIO(loggerIo.info(`Got ${signal} signal`)),
          t.chain(() => startGracefulShutdown(deps, loggerIo)),
          executeT,
        );
      });
    });

    process.on('uncaughtException', (error, origin) => {
      void pipe(
        t.fromIO(loggerIo.error({ error, origin }, 'Got uncaughtException event')),
        t.chain(() => startGracefulShutdown(deps, loggerIo)),
        executeT,
      );
    });

    process.on('unhandledRejection', (reason) => {
      void pipe(
        t.fromIO(loggerIo.error({ reason }, 'Got unhandledRejection event')),
        t.chain(() => startGracefulShutdown(deps, loggerIo)),
        executeT,
      );
    });
  };
}

function startGracefulShutdown(deps: Deps, loggerIo: LoggerIO): t.Task<never> {
  const { server, mongoDbClient } = deps;
  const { GRACEFUL_PERIOD_MS } = getAppConfig();

  return pipe(
    te.fromIO(loggerIo.info('Graceful shutdown start')),
    te.map(() => startForceExitTimer(loggerIo, GRACEFUL_PERIOD_MS)),
    te.chainFirstW(() => te.sequenceArray([closeHttpServer(server, loggerIo)])),
    te.chainFirstW(() => te.sequenceArray([disconnectMongoDbClient(mongoDbClient, loggerIo)])),
    te.chainIOK((timer) =>
      pipe(
        () => clearTimeout(timer),
        io.chain(() => loggerIo.info('Graceful shutdown done')),
        io.map(() => process.exit(0)),
      ),
    ),
    te.orLeft((error) =>
      pipe(
        loggerIo.error({ error }, `Graceful shutdown failed: ${getErrorSummary(error)}`),
        io.map(() => process.exit(1)),
        t.fromIO,
      ),
    ),
    te.toUnion,
  );
}

function startForceExitTimer(loggerIo: LoggerIO, GRACEFUL_PERIOD_MS: GracefulPeriodMs) {
  return setTimeout(
    pipe(
      loggerIo.error(`Graceful shutdown timeout after ${GRACEFUL_PERIOD_MS} ms`),
      io.map(() => process.exit(1)),
    ),
    GRACEFUL_PERIOD_MS,
  );
}
