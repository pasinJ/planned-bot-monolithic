import tUtil from 'fp-ts-std/Task';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';

import { initiatePortfolioRepository } from '#features/portfolios/repositories/portfolio.js';
import { buildHttpServer, startHttpServer } from '#infra/http/server.js';
import { createLoggerIO } from '#infra/logging.js';
import { createMongoDbClient } from '#infra/mongoDb/client.js';
import { addGracefulShutdown } from '#infra/process/shutdown.js';
import { createBnbService } from '#infra/services/binanceService.js';
import { dateService } from '#infra/services/dateService.js';
import { idService } from '#infra/services/idService.js';
import { getErrorSummary } from '#shared/error.js';

const loggerIo = createLoggerIO('Process');

await tUtil.execute(
  pipe(
    te.Do,
    te.bindW('mongoDbClient', () => createMongoDbClient(loggerIo)),
    te.bindW('binanceService', () => createBnbServiceWithDeps()),
    te.bindW('server', () => te.fromIOEither(buildHttpServer)),
    te.chainFirstW((deps) => initiatePortfolioRepositoryWithDeps(deps)),
    te.chainFirstW(({ server }) => startHttpServer(server)),
    te.chainFirstIOK((deps) => addGracefulShutdown(deps, loggerIo)),
    te.orElseFirstIOK((error) =>
      loggerIo.error({ error }, `Starting process failed: ${getErrorSummary(error)}`),
    ),
  ),
);

function createBnbServiceWithDeps() {
  return createBnbService({ dateService, idService });
}
function initiatePortfolioRepositoryWithDeps({ mongoDbClient }: { mongoDbClient: Mongoose }) {
  return te.fromIOEither(initiatePortfolioRepository(mongoDbClient));
}
