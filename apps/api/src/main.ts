import { fork } from 'child_process';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';

import { buildBtStrategyDao as buildBtStrategyDaoOrg } from '#features/btStrategies/DAOs/btStrategy.js';
import { defineBtJob } from '#features/btStrategies/executeBtStrategy/backtesting.job.js';
import { addSymbolModels, existSymbolModelByExchange } from '#features/symbols/DAOs/symbol.feature.js';
import { buildSymbolDao as buildSymbolDaoOrg } from '#features/symbols/DAOs/symbol.js';
import { HttpServer, addPluginsAndRoutes, buildHttpServer } from '#infra/http/server.js';
import { createLoggerIo, createMainLogger } from '#infra/logging.js';
import { buildMongoDbClient } from '#infra/mongoDb/client.js';
import { addGracefulShutdown } from '#infra/process/shutdown.js';
import { startupProcess } from '#infra/process/startup.js';
import { getSpotSymbolsList } from '#infra/services/binance/features/getSpotSymbols.js';
import { buildBnbService } from '#infra/services/binance/service.js';
import { dateService } from '#infra/services/date/service.js';
import { buildJobScheduler } from '#infra/services/jobScheduler/service.js';
import { AppDeps } from '#shared/appDeps.type.js';
import { executeT } from '#utils/fp.js';

type Deps = Omit<AppDeps, 'dateService'> & { mongoDbClient: Mongoose; httpServer: HttpServer };

function buildSymbolDao({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return te.fromIOEither(buildSymbolDaoOrg(mongoDbClient));
}
function buildBtStrategyDao({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return te.fromIOEither(buildBtStrategyDaoOrg(mongoDbClient));
}
function setupJobScheduler() {
  return pipe(
    buildJobScheduler({ mainLogger }),
    te.chainFirstW((jobScheduler) => te.fromIOEither(jobScheduler.composeWith(defineBtJob({ fork })))),
  );
}
function setupHttpServer(deps: Omit<Deps, 'httpServer'>) {
  return pipe(
    ioe.fromEither(buildHttpServer(mainLogger, { ...deps, dateService })),
    ioe.chainFirstW((httpServer) => httpServer.config(addPluginsAndRoutes)),
    te.fromIOEither,
  );
}
function startup({ bnbService, symbolDao, jobScheduler, httpServer }: Deps) {
  return pipe(
    startupProcess({
      loggerIo: logger,
      bnbService: { getSpotSymbolsList: bnbService.composeWith(getSpotSymbolsList) },
      symbolDao: {
        existByExchange: symbolDao.composeWith(existSymbolModelByExchange),
        add: symbolDao.composeWith(addSymbolModels),
      },
    }),
    te.chainW(() => jobScheduler.start),
    te.chainW(() => httpServer.start),
  );
}

const mainLogger = createMainLogger();
const logger = createLoggerIo('Process', mainLogger);

await executeT(
  pipe(
    te.Do,
    te.bindW('mongoDbClient', () => buildMongoDbClient(logger)),
    te.bindW('symbolDao', (deps) => buildSymbolDao(deps)),
    te.bindW('btStrategyDao', (deps) => buildBtStrategyDao(deps)),
    te.bindW('bnbService', () => te.fromIOEither(buildBnbService({ mainLogger }))),
    te.bindW('jobScheduler', () => setupJobScheduler()),
    te.bindW('httpServer', (deps) => setupHttpServer(deps)),
    te.chainFirstIOK((deps) => addGracefulShutdown(deps, logger)),
    te.chainFirstW((deps) => startup(deps)),
    te.orElseFirstIOK((error) => () => {
      logger.error({ error }, 'Starting process failed: %s', error.toString());
      process.exit(1);
    }),
  ),
);
