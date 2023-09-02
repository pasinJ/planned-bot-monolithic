import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';
import { omit } from 'ramda';

import { createBtStrategyRepo } from '#features/backtesting-strategies/btStrategy.repository.js';
import { createSymbolRepo } from '#features/symbols/symbol.repository.js';
import { ApplicationDeps } from '#infra/common.type.js';
import { buildHttpServer, startHttpServer } from '#infra/http/server.js';
import { FastifyServer } from '#infra/http/server.type.js';
import { createLoggerIo, createMainLogger } from '#infra/logging.js';
import { createMongoDbClient } from '#infra/mongoDb/client.js';
import { addGracefulShutdown } from '#infra/process/shutdown.js';
import { startupProcess } from '#infra/process/startup.js';
import { createBnbService } from '#infra/services/binance.js';
import { dateService } from '#infra/services/date.js';
import { idService } from '#infra/services/id.js';
import { getErrorSummary } from '#shared/error.js';
import { executeT } from '#utils/fp.js';

const mainLogger = createMainLogger();
const logger = createLoggerIo('Process', mainLogger);

await executeT(
  pipe(
    te.Do,
    te.bindW('mongoDbClient', () => createMongoDbClient(logger)),
    te.bindW('bnbService', () => createBnbServiceWithDeps()),
    te.bindW('symbolRepo', (deps) => createSymbolRepoWithDeps(deps)),
    te.bindW('btStrategyRepo', (deps) => createBtStrategyRepoWithDeps(deps)),
    te.bindW('httpServer', () => te.fromEither(buildHttpServer(mainLogger))),
    te.chainFirstW((deps) => startupProcessWithDeps(deps)),
    te.chainFirstW((deps) => startHttpServerWithDeps(deps)),
    te.chainFirstIOK((deps) => addGracefulShutdown(deps, logger)),
    te.orElseFirstIOK((error) =>
      logger.errorIo({ error }, 'Starting process failed: %s', getErrorSummary(error)),
    ),
    te.orElseFirstIOK(() => process.exit(1)),
  ),
);

type Deps = Omit<ApplicationDeps, 'dateService' | 'idService'> & {
  mongoDbClient: Mongoose;
  httpServer: FastifyServer;
};

function createBnbServiceWithDeps() {
  return createBnbService({ dateService, idService, mainLogger });
}
function createSymbolRepoWithDeps({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return te.fromIOEither(createSymbolRepo(mongoDbClient));
}
function createBtStrategyRepoWithDeps({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return te.fromIOEither(createBtStrategyRepo(mongoDbClient));
}
function startupProcessWithDeps(deps: Pick<Deps, 'bnbService' | 'symbolRepo'>) {
  return startupProcess({ ...deps, logger: logger });
}
function startHttpServerWithDeps(deps: Deps) {
  const { httpServer } = deps;
  return startHttpServer(httpServer, { ...omit(['mongoDbClient', 'server'], deps), dateService, idService });
}
