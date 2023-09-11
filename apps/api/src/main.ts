import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';
import { omit } from 'ramda';

import { createBtStrategyRepo } from '#features/backtesting-strategies/repositories/btStrategy.js';
import { createSymbolRepo } from '#features/symbols/repositories/symbol.js';
import { ApplicationDeps } from '#infra/common.type.js';
import { buildHttpServer, startHttpServer } from '#infra/http/server.js';
import { FastifyServer } from '#infra/http/server.type.js';
import { createLoggerIo, createMainLogger } from '#infra/logging.js';
import { createMongoDbClient } from '#infra/mongoDb/client.js';
import { addGracefulShutdown } from '#infra/process/shutdown.js';
import { startupProcess } from '#infra/process/startup.js';
import { createBnbService } from '#infra/services/binance/service.js';
import { dateService } from '#infra/services/date.js';
import { executeT } from '#utils/fp.js';

const mainLogger = createMainLogger();
const logger = createLoggerIo('Process', mainLogger);

await executeT(
  pipe(
    te.Do,
    te.bindW('mongoDbClient', () => createMongoDbClient(logger)),
    te.bindW('symbolRepo', (deps) => createSymbolRepoWithDeps(deps)),
    te.bindW('btStrategyRepo', (deps) => createBtStrategyRepoWithDeps(deps)),
    te.bindW('bnbService', (deps) => createBnbServiceWithDeps(deps)),
    te.bindW('httpServer', () => te.fromEither(buildHttpServer(mainLogger))),
    te.mapLeft((x) => x),
    te.chainFirstW((deps) => startupProcessWithDeps(deps)),
    te.chainFirstW((deps) => startHttpServerWithDeps(deps)),
    te.chainFirstIOK((deps) => addGracefulShutdown(deps, logger)),
    te.orElseFirstIOK((error) => logger.errorIo({ error }, 'Starting process failed: %s', error.toString())),
    te.orElseFirstIOK(() => process.exit(1)),
  ),
);

type Deps = Omit<ApplicationDeps, 'dateService'> & { mongoDbClient: Mongoose; httpServer: FastifyServer };

function createBnbServiceWithDeps(deps: Pick<Deps, 'symbolRepo'>) {
  return createBnbService({ dateService, symbolRepo: deps.symbolRepo, mainLogger });
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
  return startHttpServer(deps.httpServer, { ...omit(['mongoDbClient', 'server'], deps), dateService });
}
