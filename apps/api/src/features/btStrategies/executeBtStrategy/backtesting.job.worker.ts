import { Agenda, Job } from 'agenda';
import consoleStamp from 'console-stamp';
import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { levels, pino } from 'pino';
import { append, assoc } from 'ramda';
import { Stream } from 'stream';

import { btExecutionStatusEnum } from '#features/btStrategies/dataModels/btExecution.js';
import { generateOrderId } from '#features/shared/order.js';
import { getStrategyExecutorConfig } from '#features/shared/strategyExecutor/config.js';
import { startStrategyExecutor } from '#features/shared/strategyExecutor/service.js';
import { generateTradeId } from '#features/shared/trade.js';
import { getSymbolModelByNameAndExchange } from '#features/symbols/DAOs/symbol.feature.js';
import { buildSymbolDao } from '#features/symbols/DAOs/symbol.js';
import { wrapLogger } from '#infra/logging.js';
import { buildMongoDbClient } from '#infra/mongoDb/client.js';
import { getMongoDbConfig } from '#infra/mongoDb/config.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { buildBnbService } from '#infra/services/binance/service.js';
import { getJobSchedulerConfig } from '#infra/services/jobScheduler/config.js';
import { saveJobThenStopAgenda } from '#infra/services/jobScheduler/service.js';
import { AppError } from '#shared/errors/appError.js';
import { executeIo, executeT } from '#shared/utils/fp.js';

import { getBtStrategyModelById } from '../DAOs/btStrategy.feature.js';
import { buildBtStrategyDao } from '../DAOs/btStrategy.js';
import {
  addKlines,
  getFirstKlineBefore,
  getKlinesBefore,
  iterateThroughKlines,
} from '../DAOs/kline.feature.js';
import { buildKlineDao } from '../DAOs/kline.js';
import { getKlinesByApi } from '../services/binance/getKlinesByApi.js';
import { getKlinesByDailyFiles } from '../services/binance/getKlinesByDailyFiles.js';
import { getKlinesByMonthlyFiles } from '../services/binance/getKlinesByMonthlyFiles.js';
import { getKlinesForBt } from '../services/binance/getKlinesForBt.js';
import { createDirectory } from '../services/file/createDirectory.js';
import { extractZipFile } from '../services/file/extractZipFile.js';
import { readCsvFile } from '../services/file/readCsvFile.js';
import { removeDirectory } from '../services/file/removeDirectory.js';
import {
  BacktestDeps,
  backtest,
  handleBacktestFailed,
  handleBacktestSucceeded,
  initiateLogsRef,
  initiateProcessingDateRef,
  startBtProgressUpdator,
  updateBtProgress,
} from './backtest.js';
import { getBtJobConfig } from './backtesting.job.config.js';
import { BtJobData, btJobName } from './backtesting.job.js';

function createLoggers() {
  // eslint-disable-next-line no-console
  const logger = new console.Console(new Stream.Writable());
  const mainLogger = pino(
    {
      hooks: {
        logMethod: ([msg], _, levelNum) => {
          const label = levels.labels[levelNum];

          if (label === 'trace') logger.trace(msg);
          else if (label === 'debug') logger.debug(msg);
          else if (label === 'info') logger.info(msg);
          else if (label === 'warn') logger.warn(msg);
          else if (label === 'error') logger.error(msg);
          else if (label === 'fatal') logger.error(msg);
          else logger.log();
        },
      },
    },
    pino.destination('/dev/null'),
  );
  const loggerIo = wrapLogger(mainLogger);

  consoleStamp.default(logger, {
    format: ':date(yyyy-mm-dd HH:MM:ss.l o) :label',
    stdout: new Stream.Writable({
      write: (chunk: Buffer, _, cb) =>
        pipe(
          logsRef.modify(append(chunk.toString().replace(/\n$/, ''))),
          io.chain(() => cb),
          executeIo,
        ),
    }) as NodeJS.WriteStream,
  });

  return { logger, mainLogger, loggerIo };
}
function startAgenda(): te.TaskEither<void, Agenda> {
  return te.tryCatch(
    async () => {
      const { URI, COLLECTION_NAME } = getJobSchedulerConfig();
      const agenda = new Agenda({ db: { address: URI, collection: COLLECTION_NAME } });
      await agenda.start();
      return agenda;
    },
    () => process.exit(1),
  );
}
function getCurrentJobById(agenda: Agenda): te.TaskEither<void, Job<BtJobData>> {
  return te.tryCatch(
    async () => {
      const job = await agenda.jobs({
        name: btJobName,
        'data.id': executionId,
        'data.status': btExecutionStatusEnum.RUNNING,
      });
      if (job.length === 0) throw Error('Given job ID does not exist or is not running');
      else return job.at(0) as Job<BtJobData>;
    },
    () => process.exit(1),
  );
}
function addProcessSignalHandlers(job: Job<BtJobData>, agenda: Agenda): io.IO<void> {
  return () => {
    ['SIGTERM', 'SIGINT'].map((s) =>
      process.once(s, (signal) => {
        logger.warn(`Woker process receive ${signal} signal`);

        if (signal === 'SIGTERM') {
          job.attrs.data.status = btExecutionStatusEnum.TIMEOUT;
        } else {
          job.attrs.data.status = btExecutionStatusEnum.INTERUPTED;
        }
        job.attrs.result = assoc('logs', logsRef.read(), job.attrs.result);

        void saveJobThenStopAgenda({ job, agenda });
      }),
    );
    process.on('uncaughtException', (error, origin) => {
      logger.error(`Uncaught exception happened (origin: ${origin})`);
      logger.error(error);

      job.attrs.data.status = btExecutionStatusEnum.FAILED;
      job.attrs.result = assoc('logs', logsRef.read(), job.attrs.result);

      void saveJobThenStopAgenda({ job, agenda });
    });
    process.on('unhandledRejection', (error) => {
      logger.error(`Unhandled rejection happened`);
      logger.error(error);

      job.attrs.data.status = btExecutionStatusEnum.FAILED;
      job.attrs.result = assoc('logs', logsRef.read(), job.attrs.result);

      void saveJobThenStopAgenda({ job, agenda });
    });
  };
}
function prepareBacktestDeps(job: Job<BtJobData>): te.TaskEither<AppError, BacktestDeps> {
  return pipe(
    te.Do,
    te.bindW('bnbService', () => te.fromIOEither(buildBnbService({ getBnbConfig, mainLogger }))),
    te.bindW('mongoClient', () => buildMongoDbClient(loggerIo, getMongoDbConfig)),
    te.bindW('btStrategyDao', ({ mongoClient }) => te.fromIOEither(buildBtStrategyDao(mongoClient))),
    te.bindW('symbolDao', ({ mongoClient }) => te.fromIOEither(buildSymbolDao(mongoClient))),
    te.bindW('klineDao', ({ mongoClient }) => te.fromIOEither(buildKlineDao(mongoClient))),
    te.let('startStrategyExecutor', () =>
      startStrategyExecutor({ isolatedConsole: logger, loggerIo, getConfig: getStrategyExecutorConfig }),
    ),
    te.let('startBtProgressUpdator', () =>
      startBtProgressUpdator({
        logsRef,
        processingDateRef,
        loggerIo,
        getConfig: getBtJobConfig,
        updateBtProgress: updateBtProgress(job),
      }),
    ),
    te.let('getKlinesFromApi', ({ bnbService }) => bnbService.composeWith(getKlinesByApi)),
    te.let('getKlinesFromDailyFiles', ({ bnbService, getKlinesFromApi }) =>
      bnbService.composeWith(({ httpClient }) =>
        getKlinesByDailyFiles({
          httpClient,
          fileService: { extractZipFile, readCsvFile },
          bnbService: { getConfig: getBnbConfig, getKlinesByApi: getKlinesFromApi },
        }),
      ),
    ),
    te.let('getKlinesFromMonthlyFiles', ({ bnbService, getKlinesFromApi, getKlinesFromDailyFiles }) =>
      bnbService.composeWith(({ httpClient }) =>
        getKlinesByMonthlyFiles({
          httpClient,
          fileService: { extractZipFile, readCsvFile },
          bnbService: {
            getConfig: getBnbConfig,
            getKlinesByApi: getKlinesFromApi,
            getKlinesByDailyFiles: getKlinesFromDailyFiles,
          },
        }),
      ),
    ),
    te.map(
      ({
        btStrategyDao,
        symbolDao,
        klineDao,
        startStrategyExecutor,
        startBtProgressUpdator,
        getKlinesFromApi,
        getKlinesFromDailyFiles,
        getKlinesFromMonthlyFiles,
      }) =>
        ({
          job,
          loggerIo,
          generateOrderId,
          generateTradeId,
          btStrategyDao: { getById: btStrategyDao.composeWith(getBtStrategyModelById) },
          symbolDao: { getByNameAndExchange: symbolDao.composeWith(getSymbolModelByNameAndExchange) },
          klineDao: {
            add: klineDao.composeWith(addKlines),
            getBefore: klineDao.composeWith(getKlinesBefore),
            getFirstBefore: klineDao.composeWith(getFirstKlineBefore),
            iterateThroughKlines: klineDao.composeWith(iterateThroughKlines),
          },
          bnbService: {
            getKlinesForBt: getKlinesForBt({
              bnbService: {
                getConfig: getBnbConfig,
                getKlinesByApi: getKlinesFromApi,
                getKlinesByDailyFiles: getKlinesFromDailyFiles,
                getKlinesByMonthlyFiles: getKlinesFromMonthlyFiles,
              },
              fileService: { createDirectory, removeDirectory },
            }),
          },
          startStrategyExecutor,
          startBtProgressUpdator,
          processingDateRef,
        }) as BacktestDeps,
    ),
    te.chainFirstIOK(() => loggerIo.infoIo('Backtesting dependencies created')),
  );
}

const executionId = process.argv[2];
// eslint-disable-next-line no-console
const { logger, mainLogger, loggerIo } = createLoggers();
const logsRef = initiateLogsRef();
const processingDateRef = initiateProcessingDateRef();

await executeT(
  pipe(
    te.fromIO(loggerIo.infoIo(`Worker process for backtesting job (id:${executionId}) started`)),
    te.bindW('agenda', () => startAgenda()),
    te.bindW('job', ({ agenda }) => getCurrentJobById(agenda)),
    te.chainFirstIOK(({ job, agenda }) => addProcessSignalHandlers(job, agenda)),
    te.chainTaskK(({ job, agenda }) =>
      pipe(
        prepareBacktestDeps(job),
        te.chainW(backtest),
        te.matchE(
          (error) => handleBacktestFailed({ job, agenda, logsRef, loggerIo }, error),
          (refs) => handleBacktestSucceeded({ job, agenda, logsRef, loggerIo, ...refs }),
        ),
      ),
    ),
  ),
);
