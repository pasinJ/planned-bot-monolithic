import { fork } from 'child_process';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';

import { buildBtExecutionDao as buildBtExecutionDaoOrg } from '#features/btStrategies/DAOs/btExecution.js';
import { buildBtStrategyDao as buildBtStrategyDaoOrg } from '#features/btStrategies/DAOs/btStrategy.js';
import { getBtJobConfig } from '#features/btStrategies/executeBtStrategy/backtesting.job.config.js';
import { defineBtJob } from '#features/btStrategies/executeBtStrategy/backtesting.job.js';
import { addSymbolModels, existSymbolModelByExchange } from '#features/symbols/DAOs/symbol.feature.js';
import { buildSymbolDao as buildSymbolDaoOrg } from '#features/symbols/DAOs/symbol.js';
import { getHttpConfig } from '#infra/http/server.config.js';
import { HttpServer, addPluginsAndRoutes, buildHttpServer } from '#infra/http/server.js';
import { createLoggerIo, createMainLogger } from '#infra/logging.js';
import { buildMongoDbClient } from '#infra/mongoDb/client.js';
import { getMongoDbConfig } from '#infra/mongoDb/config.js';
import { addGracefulShutdown } from '#infra/process/shutdown.js';
import { startupProcess } from '#infra/process/startup.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { getSpotSymbolsList } from '#infra/services/binance/features/getSpotSymbols.js';
import { buildBnbService } from '#infra/services/binance/service.js';
import { dateService } from '#infra/services/date/service.js';
import { getJobSchedulerConfig } from '#infra/services/jobScheduler/config.js';
import { buildJobScheduler } from '#infra/services/jobScheduler/service.js';
import { getAppConfig } from '#shared/app.config.js';
import { AppDeps } from '#shared/appDeps.type.js';
import { executeT } from '#utils/fp.js';

type Deps = Omit<AppDeps, 'dateService'> & { mongoDbClient: Mongoose; httpServer: HttpServer };

function buildSymbolDao({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return te.fromIOEither(buildSymbolDaoOrg(mongoDbClient));
}
function buildBtStrategyDao({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return te.fromIOEither(buildBtStrategyDaoOrg(mongoDbClient));
}
function buildBtExecutionDao({ mongoDbClient }: Pick<Deps, 'mongoDbClient'>) {
  return pipe(
    te.fromIO(getJobSchedulerConfig),
    te.chainW(({ COLLECTION_NAME }) =>
      te.fromIOEither(buildBtExecutionDaoOrg(mongoDbClient, COLLECTION_NAME)),
    ),
  );
}
function setupJobScheduler() {
  return pipe(
    buildJobScheduler({ mainLogger, getJobSchedulerConfig }),
    te.chainFirstW((jobScheduler) =>
      te.fromIOEither(jobScheduler.composeWith(defineBtJob({ fork, getBtJobConfig }))),
    ),
  );
}
function setupHttpServer(deps: Omit<Deps, 'httpServer'>) {
  return pipe(
    ioe.fromEither(buildHttpServer(mainLogger, getHttpConfig, { ...deps, dateService })),
    ioe.chainFirstW((httpServer) => httpServer.config(addPluginsAndRoutes)),
    te.fromIOEither,
  );
}
function startup({ bnbService, symbolDao, jobScheduler, httpServer }: Deps) {
  return pipe(
    startupProcess({
      getAppConfig,
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

const appConfig = getAppConfig();
const mainLogger = createMainLogger(appConfig);
const logger = createLoggerIo('Process', mainLogger);

await executeT(
  pipe(
    te.Do,
    te.bindW('mongoDbClient', () => buildMongoDbClient(logger, getMongoDbConfig)),
    te.bindW('symbolDao', (deps) => buildSymbolDao(deps)),
    te.bindW('btStrategyDao', (deps) => buildBtStrategyDao(deps)),
    te.bindW('btExecutionDao', (deps) => buildBtExecutionDao(deps)),
    te.bindW('bnbService', () => te.fromIOEither(buildBnbService({ mainLogger, getBnbConfig }))),
    te.bindW('jobScheduler', () => setupJobScheduler()),
    te.bindW('httpServer', (deps) => setupHttpServer(deps)),
    te.chainFirstIOK((deps) => addGracefulShutdown({ ...deps, getAppConfig }, logger)),
    te.chainFirstW((deps) => startup(deps)),
    te.orElseFirstIOK((error) => () => {
      logger.error({ error }, 'Starting process failed: %s', error.toString());
      process.exit(1);
    }),
  ),
);
