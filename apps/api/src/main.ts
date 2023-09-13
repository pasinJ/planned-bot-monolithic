import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';
import { omit } from 'ramda';

import { createBtStrategyModelDao } from '#features/backtesting-strategies/data-models/btStrategy.dao.js';
import { createSymbolModelDao } from '#features/symbols/data-models/symbol.dao.js';
import { buildHttpServer, startHttpServer } from '#infra/http/server.js';
import { FastifyServer } from '#infra/http/server.type.js';
import { createLoggerIo, createMainLogger } from '#infra/logging.js';
import { createMongoDbClient } from '#infra/mongoDb/client.js';
import { addGracefulShutdown } from '#infra/process/shutdown.js';
import { startupProcess } from '#infra/process/startup.js';
import { createBnbService } from '#infra/services/binance/service.js';
import { dateService } from '#infra/services/date/service.js';
import { createJobScheduler } from '#infra/services/jobScheduler/service.js';
import { AppDeps } from '#shared/appDeps.type.js';
import { executeT } from '#utils/fp.js';

const mainLogger = createMainLogger();
const logger = createLoggerIo('Process', mainLogger);

await executeT(
  pipe(
    te.Do,
    te.bindW('mongoDbClient', () => createMongoDbClient(logger)),
    te.bindW('symbolModelDao', (deps) => createSymbolModelDaoWithDeps(deps)),
    te.bindW('btStrategyModelDao', (deps) => createBtStrategyModelDaoWithDeps(deps)),
    te.bindW('bnbService', (deps) => createBnbServiceWithDeps(deps)),
    te.bindW('jobScheduler', () => createJobScheduler()),
    te.bindW('httpServer', () => te.fromEither(buildHttpServer(mainLogger))),
    te.mapLeft((x) => x),
    te.chainFirstW((deps) => startupProcessWithDeps(deps)),
    te.chainFirstW((deps) => startHttpServerWithDeps(deps)),
    te.chainFirstIOK((deps) => addGracefulShutdown(deps, logger)),
    te.orElseFirstIOK((error) => logger.errorIo({ error }, 'Starting process failed: %s', error.toString())),
    te.orElseFirstIOK(() => process.exit(1)),
  ),
);

type Deps = Omit<AppDeps, 'dateService'> & { mongoDbClient: Mongoose; httpServer: FastifyServer };

function createBnbServiceWithDeps(deps: Pick<Deps, 'symbolModelDao'>) {
  return createBnbService({ dateService, symbolModelDao: deps.symbolModelDao, mainLogger });
}
function createSymbolModelDaoWithDeps({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return te.fromIOEither(createSymbolModelDao(mongoDbClient));
}
function createBtStrategyModelDaoWithDeps({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return te.fromIOEither(createBtStrategyModelDao(mongoDbClient));
}
function startupProcessWithDeps(deps: Pick<Deps, 'bnbService' | 'symbolModelDao'>) {
  return startupProcess({ ...deps, logger: logger });
}
function startHttpServerWithDeps(deps: Deps) {
  return startHttpServer(deps.httpServer, { ...omit(['mongoDbClient', 'server'], deps), dateService });
}
