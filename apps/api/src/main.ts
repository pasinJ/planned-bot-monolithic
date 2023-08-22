import tUtil from 'fp-ts-std/Task';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { initiatePortfolioRepository } from '#features/portfolios/repositories/portfolio.js';
import { buildHttpServer, startHttpServer } from '#infra/http/server.js';
import { createLoggerIO } from '#infra/logging.js';
import { createMongoDbClient } from '#infra/mongoDb/client.js';
import { addGracefulShutdown } from '#infra/process/shutdown.js';
import { createBinanceService } from '#infra/services/binanceService.js';
import { getErrorSummary } from '#shared/error.js';

const loggerIo = createLoggerIO('Process');

await tUtil.execute(
  pipe(
    te.Do,
    te.bindW('mongoDbClient', () => createMongoDbClient(loggerIo)),
    te.bindW('binanceService', () => createBinanceService),
    te.bindW('server', () => te.fromIOEither(buildHttpServer)),
    te.chainFirstW(({ mongoDbClient }) => te.fromIOEither(initiatePortfolioRepository(mongoDbClient))),
    te.chainFirstW(({ server }) => startHttpServer(server)),
    te.chainFirstIOK((deps) => addGracefulShutdown(deps, loggerIo)),
    te.orElseFirstIOK((error) =>
      loggerIo.error({ error }, `Starting process failed: ${getErrorSummary(error)}`),
    ),
  ),
);
