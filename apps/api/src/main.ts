import { fork } from 'child_process';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';

import { createBtStrategyModelDao } from '#features/backtesting-strategies/data-models/btStrategy.dao.js';
import { defineBtJob } from '#features/backtesting-strategies/executeBtStrategy/backtesting.job.js';
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
    te.bindW('symbolModelDao', (deps) => setupSymbolModelDao(deps)),
    te.bindW('btStrategyModelDao', (deps) => setupBtStrategyModelDao(deps)),
    te.bindW('bnbService', (deps) => setupBnbService(deps)),
    te.bindW('jobScheduler', () => setupJobScheduler()),
    te.bindW('httpServer', () => te.fromEither(buildHttpServer(mainLogger))),
    te.chainFirstW((deps) => startupProcessWithDeps(deps)),
    te.chainFirstW((deps) => startHttpServerWithDeps(deps)),
    te.chainFirstIOK((deps) => addGracefulShutdown(deps, logger)),
    te.orElseFirstIOK((error) => logger.errorIo({ error }, 'Starting process failed: %s', error.toString())),
    te.orElseFirstIOK(() => process.exit(1)),
  ),
);

type Deps = Omit<AppDeps, 'dateService'> & { mongoDbClient: Mongoose; httpServer: FastifyServer };

function setupSymbolModelDao({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return te.fromIOEither(createSymbolModelDao(mongoDbClient));
}
function setupBtStrategyModelDao({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return te.fromIOEither(createBtStrategyModelDao(mongoDbClient));
}
function setupBnbService(deps: Pick<Deps, 'symbolModelDao'>) {
  return createBnbService({ dateService, symbolModelDao: deps.symbolModelDao, mainLogger });
}
function setupJobScheduler() {
  return pipe(
    createJobScheduler({ mainLogger }),
    te.chainFirstW(({ agenda, loggerIo }) => te.fromIOEither(defineBtJob(agenda, loggerIo, { fork }))),
  );
}
function startupProcessWithDeps(deps: Pick<Deps, 'bnbService' | 'symbolModelDao'>) {
  return startupProcess({ ...deps, logger: logger });
}
function startHttpServerWithDeps(deps: Deps) {
  return startHttpServer(deps.httpServer, {
    dateService,
    bnbService: deps.bnbService,
    btStrategyModelDao: deps.btStrategyModelDao,
    jobScheduler: deps.jobScheduler,
    symbolModelDao: deps.symbolModelDao,
  });
}
