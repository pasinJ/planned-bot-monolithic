import io from 'fp-ts/lib/IO.js';
import { Logger } from 'pino';

import { FastifyServer, closeHttpServer } from '#infra/http/server.js';
import { GracefulPeriodMs, getAppConfig } from '#shared/config/app.config.js';

export function addGracefulShutdown(server: FastifyServer, logger: Logger): io.IO<void> {
  return () => {
    ['SIGTERM', 'SIGINT'].forEach((signal) => {
      process.on(signal, () => {
        logger.info(`Got ${signal} signal`);
        startGracefulShutdown(server, logger);
      });
    });

    process.on('uncaughtException', (error, origin) => {
      logger.error({ error, origin }, 'Got uncaughtException');
      startGracefulShutdown(server, logger);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error({ reason }, 'Got unhandledRejection');
      startGracefulShutdown(server, logger);
    });
  };
}

function startGracefulShutdown(server: FastifyServer, logger: Logger) {
  const { GRACEFUL_PERIOD_MS } = getAppConfig();
  try {
    void gracefulShutdown(server, logger, GRACEFUL_PERIOD_MS).then(() => process.exit(0));
  } catch (error) {
    logger.error({ error }, 'Graceful shutdown failed');
    process.exit(1);
  }
}

async function gracefulShutdown(server: FastifyServer, logger: Logger, GRACEFUL_PERIOD_MS: GracefulPeriodMs) {
  logger.info('Graceful shutdown start');
  const timer = startForceExitTimer(logger, GRACEFUL_PERIOD_MS);

  await Promise.allSettled([closeHttpServer(server, logger)]);

  //   await Promise.allSettled([
  //     disconnectDbConnection(logger),
  //     disconnectRedis(logger),
  //   ]);

  clearTimeout(timer);
  logger.info('Graceful shutdown done');
}

function startForceExitTimer(logger: Logger, GRACEFUL_PERIOD_MS: GracefulPeriodMs) {
  return setTimeout(() => {
    logger.error(`Graceful shutdown timeout after ${GRACEFUL_PERIOD_MS} ms`);
    process.exit(1);
  }, GRACEFUL_PERIOD_MS);
}
