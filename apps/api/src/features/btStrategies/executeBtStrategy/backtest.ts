import { Agenda, Job } from 'agenda';
import { minTime } from 'date-fns/constants';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import ior from 'fp-ts/lib/IORef.js';
import o from 'fp-ts/lib/Option.js';
import readonlyNonEmptyArray, { ReadonlyNonEmptyArray } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, assoc, drop, isNotNil, mergeRight } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { ExchangeName } from '#features/shared/exchange.js';
import { Kline, calculateNumOfKlinesInDateRange } from '#features/shared/kline.js';
import { DateRange, createDateRange } from '#features/shared/objectValues/dateRange.js';
import { OrderId, PendingOrderRequest } from '#features/shared/order.js';
import { mapCapitalCurrencyToAssetCurrency } from '#features/shared/strategy.js';
import {
  ExecuteStrategyError,
  OrdersLists,
  TradesLists,
} from '#features/shared/strategyExecutor/executeStrategy.js';
import {
  StartStrategyExecutor,
  StartStrategyExecutorError,
  StrategyExecutor,
} from '#features/shared/strategyExecutor/service.js';
import { buildKlinesModule } from '#features/shared/strategyExecutorContext/klines.js';
import { buildOrdersModule } from '#features/shared/strategyExecutorContext/orders.js';
import {
  StrategyModule,
  initiateStrategyModule,
  updateStrategyModuleStats,
} from '#features/shared/strategyExecutorContext/strategy.js';
import { buildSystemModule } from '#features/shared/strategyExecutorContext/system.js';
import { buildTechnicalAnalysisModule } from '#features/shared/strategyExecutorContext/technicalAnalysis.js';
import { buildTradesModules } from '#features/shared/strategyExecutorContext/trades.js';
import { Symbol, SymbolName } from '#features/shared/symbol.js';
import { TradeId, updateOpeningTradeStats } from '#features/shared/trade.js';
import { SymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { LoggerIo } from '#infra/logging.js';
import { DateService } from '#infra/services/date/service.js';
import { saveJobThenStopAgenda } from '#infra/services/jobScheduler/service.js';
import { AppError } from '#shared/errors/appError.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { isError } from '#shared/utils/general.js';
import { isString } from '#shared/utils/string.js';

import {
  AddKlines,
  CountKlines,
  CountKlinesFilter,
  CreateKlinesIteratorError,
  GetFirstKlineBefore,
  GetKlinesBefore,
  GetNextKlineIterationError,
  IterateThroughKlines,
} from '../../klines/DAOs/kline.feature.js';
import { BtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import {
  BT_PROGRESS_PERCENTAGE_FINISHED,
  BtProgressPercentage,
  btExecutionStatusEnum,
  calculateProgressPercentage,
} from '../dataModels/btExecution.js';
import { BtStrategyId, BtStrategyModel, extendBtRange } from '../dataModels/btStrategy.js';
import { GetKlinesForBt } from '../services/binance/getKlinesForBt.js';
import { BtProgressUpdateInterval } from './backtesting.job.config.js';
import { BtJobData } from './backtesting.job.js';
import { ProcessOpeningOrdersError, processOpeningOrders } from './processOpeningOrders.js';
import { processPendingOrders } from './processPendingOrders.js';
import { ProcessTriggeredOrdersError, processTriggeredOrders } from './processTriggeredOrders.js';

export type BacktestDeps = { job: Job<BtJobData> } & DeepReadonly<{
  loggerIo: LoggerIo;
  generateOrderId: io.IO<OrderId>;
  generateTradeId: io.IO<TradeId>;
  btStrategyDao: {
    getById: (
      id: BtStrategyId,
    ) => te.TaskEither<BtStrategyDaoError<'GetByIdFailed' | 'NotExist'>, BtStrategyModel>;
  };
  bnbService: { getKlinesForBt: GetKlinesForBt };
  klineDao: {
    add: AddKlines;
    count: CountKlines;
    getBefore: GetKlinesBefore;
    getFirstBefore: GetFirstKlineBefore;
    iterateThroughKlines: IterateThroughKlines;
  };
  symbolDao: {
    getByNameAndExchange: (
      name: SymbolName,
      exchange: ExchangeName,
    ) => te.TaskEither<SymbolDaoError<'GetByNameAndExchangeFailed' | 'NotExist'>, Symbol>;
  };
  startStrategyExecutor: ReturnType<StartStrategyExecutor>;
  startBtProgressUpdator: StartBtProgressUpdator;
  processingDateRef: ior.IORef<ValidDate>;
}>;
export function backtest(deps: BacktestDeps) {
  const {
    job,
    loggerIo,
    generateOrderId,
    generateTradeId,
    btStrategyDao,
    bnbService,
    klineDao,
    symbolDao,
    startStrategyExecutor,
    startBtProgressUpdator,
    processingDateRef,
  } = deps;

  const onEachDeps = { generateOrderId, generateTradeId, processingDateRef };
  const startBtDeps = { startStrategyExecutor, startBtProgressUpdator, klineDao, loggerIo };

  const btStrategyId = job.attrs.data.btStrategyId;

  const getBtStrategy = pipe(
    btStrategyDao.getById(btStrategyId),
    te.chainFirstIOK(() => loggerIo.infoIo('Got backtesting strategy from database')),
  );
  function getKlinesFromExchange(btStrategy: BtStrategyModel) {
    const executionId = job.attrs.data.id;
    const extendedStart = extendBtRange(
      btStrategy.startTimestamp,
      btStrategy.timeframe,
      btStrategy.maxNumKlines,
    );
    const countKlinesFilter: CountKlinesFilter = {
      exchange: btStrategy.exchange,
      symbol: btStrategy.symbol,
      timeframe: btStrategy.timeframe,
      start: extendedStart,
      end: btStrategy.endTimestamp,
    };
    const expectedKlines = calculateNumOfKlinesInDateRange(
      { start: extendedStart, end: btStrategy.endTimestamp } as unknown as DateRange,
      btStrategy.timeframe,
    );
    const downloadKlinesRequest = {
      executionId,
      symbol: btStrategy.symbol,
      timeframe: btStrategy.timeframe,
      maxKlinesNum: btStrategy.maxNumKlines,
      startTimestamp: btStrategy.startTimestamp,
      endTimestamp: btStrategy.endTimestamp,
    };
    return pipe(
      klineDao.count(countKlinesFilter),
      te.chainW((existingKlines) =>
        existingKlines >= expectedKlines
          ? te.fromIO(
              loggerIo.infoIo(`Expected klines of ${btStrategy.symbol} already exists. Skip downloading.`),
            )
          : pipe(
              bnbService.getKlinesForBt(downloadKlinesRequest),
              te.chainFirstIOK((klines) =>
                loggerIo.infoIo(
                  `Downloaded ${klines.length} klines of ${btStrategy.symbol} from ${btStrategy.exchange}`,
                ),
              ),
              te.chainW(klineDao.add),
              te.chainFirstIOK(() => loggerIo.infoIo(`Added klines to database`)),
              te.asUnit,
            ),
      ),
    );
  }
  function getSymbol(btStrategy: BtStrategyModel) {
    return pipe(
      symbolDao.getByNameAndExchange(btStrategy.symbol, btStrategy.exchange),
      te.chainFirstIOK(() => loggerIo.infoIo(`Got ${btStrategy.symbol} symbol from database`)),
    );
  }

  return pipe(
    te.Do,
    te.bindW('btStrategy', () => getBtStrategy),
    te.chainFirstW(({ btStrategy }) => getKlinesFromExchange(btStrategy)),
    te.bindW('symbol', ({ btStrategy }) => getSymbol(btStrategy)),
    te.bindW('refs', ({ btStrategy, symbol }) =>
      pipe(
        te.Do,
        te.bindW('klinesRef', () => initiateKlinesRef({ klineDao, loggerIo }, btStrategy)),
        te.let('strategyModuleRef', () => initiateStrategyModuleRef(btStrategy, symbol)),
        te.let('ordersRef', initiateOrdersRef),
        te.let('tradesRef', initiateTradesRef),
      ),
    ),
    te.chainW(({ btStrategy, symbol, refs }) =>
      pipe(buildOnEachCallback({ ...onEachDeps, refs }, btStrategy, symbol), (onEachCallback) =>
        startBacktesting({ ...startBtDeps, onEachCallback, refs }, btStrategy),
      ),
    ),
  );
}

type Refs = {
  klinesRef: ior.IORef<ReadonlyNonEmptyArray<Kline>>;
  ordersRef: ior.IORef<OrdersLists>;
  tradesRef: ior.IORef<TradesLists>;
  strategyModuleRef: ior.IORef<StrategyModule>;
};

type OnEachCallback = (currentKline: Kline) => te.TaskEither<OnEachCallbackError, void>;
type OnEachCallbackError = ExecuteStrategyError | ProcessOpeningOrdersError | ProcessTriggeredOrdersError;

export type BuildOnEachCallbackDeps = DeepReadonly<{
  generateOrderId: io.IO<OrderId>;
  generateTradeId: io.IO<TradeId>;
  processingDateRef: ior.IORef<ValidDate>;
  refs: Refs;
}>;
function buildOnEachCallback(deps: BuildOnEachCallbackDeps, btStrategy: BtStrategyModel, symbol: Symbol) {
  return (strategyExecutor: StrategyExecutor): OnEachCallback => {
    const { generateOrderId, generateTradeId, refs, processingDateRef } = deps;
    const { klinesRef, ordersRef, tradesRef, strategyModuleRef } = refs;
    const { body, language, timezone, maxNumKlines } = btStrategy;

    function appendToFixedMaxSizeArray(newKline: Kline) {
      return (klines: ReadonlyNonEmptyArray<Kline>): ReadonlyNonEmptyArray<Kline> => {
        let newKlines = append(newKline, klines);
        if (newKlines.length > maxNumKlines) newKlines = drop(1, newKlines);
        return newKlines as [Kline, ...Kline[]];
      };
    }

    type ExecutionRequest = DeepReadonly<{
      strategyModule: StrategyModule;
      orders: OrdersLists;
      trades: TradesLists;
    }>;
    function _updateOpeningTradeStats(currentKline: Kline) {
      return (request: ExecutionRequest): ExecutionRequest => ({
        ...request,
        trades: {
          ...request.trades,
          openingTrades: request.trades.openingTrades.map((trade) =>
            updateOpeningTradeStats(trade, currentKline),
          ),
        },
      });
    }
    function _processOpeningOrders(dateService: DateService, currentKline: Kline) {
      return (request: ExecutionRequest): ioe.IOEither<ProcessOpeningOrdersError, ExecutionRequest> => {
        const { strategyModule, orders: prevOrders, trades } = request;

        return pipe(
          processOpeningOrders(
            { dateService, generateTradeId },
            strategyModule,
            prevOrders,
            trades,
            currentKline,
          ),
          ioe.map(({ strategyModule, orders, trades }) => ({
            strategyModule,
            orders: mergeRight(prevOrders, orders),
            trades,
          })),
        );
      };
    }
    function _processTriggeredOrders(dateService: DateService, currentKline: Kline) {
      return (request: ExecutionRequest): ioe.IOEither<ProcessTriggeredOrdersError, ExecutionRequest> => {
        const { strategyModule, orders: prevOrders, trades } = request;

        return pipe(
          processTriggeredOrders(
            { dateService, generateTradeId },
            strategyModule,
            prevOrders,
            trades,
            currentKline,
          ),
          ioe.map(({ strategyModule, orders, trades }) => ({
            strategyModule,
            orders: mergeRight(prevOrders, orders),
            trades,
          })),
        );
      };
    }
    function _updateStrategyModuleStats(request: ExecutionRequest): ExecutionRequest {
      return {
        ...request,
        strategyModule: updateStrategyModuleStats(
          request.strategyModule,
          request.trades.openingTrades,
          request.trades.closedTrades,
        ),
      };
    }
    function _processPendingOrders(dateService: DateService, currentKline: Kline, request: ExecutionRequest) {
      return (pendingOrderRequests: readonly PendingOrderRequest[]): io.IO<ExecutionRequest> => {
        const { strategyModule, orders: prevOrders, trades } = request;

        return pipe(
          processPendingOrders(
            { dateService, generateTradeId },
            strategyModule,
            { ...prevOrders, pendingOrders: pendingOrderRequests },
            trades,
            currentKline.close,
          ),
          io.map(({ strategyModule, orders, trades }) => ({
            strategyModule,
            orders: mergeRight(prevOrders, orders),
            trades,
          })),
        );
      };
    }

    return (currentKline) =>
      pipe(
        klinesRef.modify(appendToFixedMaxSizeArray(currentKline)),
        io.let('processingDate', () => currentKline.closeTimestamp),
        io.let('dateService', ({ processingDate }) => ({ getCurrentDate: io.of(processingDate) })),
        io.chainFirst(({ processingDate }) => processingDateRef.write(processingDate)),
        io.bind('klines', () => klinesRef.read),
        te.fromIO,
        te.bindW('request', ({ dateService }) =>
          pipe(
            io.Do,
            io.bind('orders', () => ordersRef.read),
            io.bind('trades', () => tradesRef.read),
            io.bind('strategyModule', () => strategyModuleRef.read),
            te.fromIO,
            te.map(_updateOpeningTradeStats(currentKline)),
            te.chainIOEitherKW(_processOpeningOrders(dateService, currentKline)),
            te.chainIOEitherKW(_processTriggeredOrders(dateService, currentKline)),
            te.map(_updateOpeningTradeStats(currentKline)),
            te.map(_updateStrategyModuleStats),
          ),
        ),
        te.chainW(({ klines, request, dateService }) =>
          pipe(
            {
              klinesModule: buildKlinesModule(klines, timezone),
              ordersModule: buildOrdersModule({ dateService, generateOrderId }, symbol, request.orders),
              tradesModule: buildTradesModules(request.trades.openingTrades, request.trades.closedTrades),
              strategyModule: request.strategyModule,
              technicalAnalysisModule: buildTechnicalAnalysisModule(klines),
              systemModule: buildSystemModule({ dateService }, timezone),
            },
            (modules) => strategyExecutor.execute(body, language, modules),
            te.chainIOK(_processPendingOrders(dateService, currentKline, request)),
          ),
        ),
        te.chainIOK(({ orders, trades, strategyModule }) =>
          io.sequenceArray([
            strategyModuleRef.write(strategyModule),
            ordersRef.write(orders),
            tradesRef.write(trades),
          ]),
        ),
        te.asUnit,
      );
  };
}

export type StartBacktestingDeps = {
  startStrategyExecutor: ReturnType<StartStrategyExecutor>;
  startBtProgressUpdator: StartBtProgressUpdator;
  klineDao: { iterateThroughKlines: IterateThroughKlines };
  onEachCallback: (strategyExecutor: StrategyExecutor) => OnEachCallback;
  refs: Refs;
  loggerIo: LoggerIo;
};
type StartBacktestingError =
  | StartStrategyExecutorError
  | CreateKlinesIteratorError
  | OnEachCallbackError
  | GetNextKlineIterationError;
export function startBacktesting(
  deps: StartBacktestingDeps,
  btStrategy: BtStrategyModel,
): te.TaskEither<StartBacktestingError, Refs> {
  const { startStrategyExecutor, startBtProgressUpdator, klineDao, onEachCallback, refs, loggerIo } = deps;

  type IterateKlinesError = CreateKlinesIteratorError | OnEachCallbackError | GetNextKlineIterationError;
  function iterateKlines(strategyExecutor: StrategyExecutor): te.TaskEither<IterateKlinesError, Refs> {
    return () =>
      new Promise((resolve) => {
        const klinesFilter = {
          exchange: btStrategy.exchange,
          symbol: btStrategy.symbol,
          timeframe: btStrategy.timeframe,
          start: btStrategy.startTimestamp,
          end: btStrategy.endTimestamp,
        };

        const onEach = onEachCallback(strategyExecutor);
        type OnErrorError = OnEachCallbackError | GetNextKlineIterationError;
        const onError = (error: OnErrorError) => () => resolve(e.left(error));
        const onFinish = () => resolve(e.right(refs));

        pipe(
          klineDao.iterateThroughKlines(klinesFilter, { onEach, onError, onFinish }),
          ioe.mapLeft((error) => resolve(e.left(error))),
          executeIo,
        );
      });
  }

  return pipe(
    te.Do,
    te.bindW('btProgressUpdator', () =>
      pipe(
        createDateRange(btStrategy.startTimestamp, btStrategy.endTimestamp),
        unsafeUnwrapEitherRight,
        startBtProgressUpdator,
        te.fromIO,
      ),
    ),
    te.bindW('strategyExecutor', () => startStrategyExecutor),
    te.chainW(({ btProgressUpdator, strategyExecutor }) =>
      pipe(
        iterateKlines(strategyExecutor),
        t.chainFirstIOK(() => strategyExecutor.stop),
        t.chainFirstIOK(() => btProgressUpdator.stop),
      ),
    ),
    te.chainFirstIOK(() => loggerIo.infoIo(`Strategy execution succeeded`)),
    te.orElseFirstIOK((error) => loggerIo.errorIo(`Strategy execution failed: ${error.toString()}`)),
  );
}

export type BtProgressUpdatorDeps = DeepReadonly<{
  getConfig: io.IO<{ PROGRESS_UPDATE_INTERVAL: BtProgressUpdateInterval }>;
  processingDateRef: ior.IORef<ValidDate>;
  logsRef: ior.IORef<readonly string[]>;
  updateBtProgress: UpdateBtProgress;
  loggerIo: LoggerIo;
}>;
type StartBtProgressUpdator = (btDateRange: DateRange) => io.IO<BtProgressUpdator>;
export type BtProgressUpdator = DeepReadonly<{ stop: io.IO<void> }>;
export function startBtProgressUpdator(deps: BtProgressUpdatorDeps): StartBtProgressUpdator {
  return (btDateRange) => {
    const { getConfig, updateBtProgress, processingDateRef, logsRef, loggerIo } = deps;

    return pipe(
      getConfig,
      io.map(({ PROGRESS_UPDATE_INTERVAL }) =>
        setInterval(() => {
          const percentage = calculateProgressPercentage(btDateRange, processingDateRef.read());
          const logs = logsRef.read();
          void pipe(
            updateBtProgress(percentage, logs),
            te.orElseFirstIOK((reason) =>
              loggerIo.errorIo(`Updating backtesting progress failed because ${reason}`),
            ),
            executeT,
          );
        }, PROGRESS_UPDATE_INTERVAL),
      ),
      io.chainFirst(() => loggerIo.infoIo('Progress updator has been started')),
      io.map((timer) => ({
        stop: pipe(
          () => clearInterval(timer),
          io.chain(() => loggerIo.infoIo('Progress updator has been stopped')),
        ),
      })),
    );
  };
}

type UpdateBtProgress = (
  progressPercentage: BtProgressPercentage,
  logs: readonly string[],
) => te.TaskEither<string, void>;
export function updateBtProgress(job: Job<BtJobData>): UpdateBtProgress {
  return (progressPercentage, logs) =>
    te.tryCatch(
      async () => {
        job.attrs.result = assoc('logs', logs, job.attrs.result);
        job.attrs.data = assoc('percentage', progressPercentage, job.attrs.data);

        await job.save();
      },
      (reason) =>
        `Updating backteing progress failed${
          isError(reason) || isString(reason) ? ' ' + reason.toString() : ''
        }`,
    );
}

export function initiateLogsRef(): ior.IORef<readonly string[]> {
  return new ior.IORef([]);
}

export function initiateProcessingDateRef(): ior.IORef<ValidDate> {
  return new ior.IORef(new Date(minTime) as ValidDate);
}

type InitiateKlinesRefDeps = DeepReadonly<{
  klineDao: { getBefore: GetKlinesBefore; getFirstBefore: GetFirstKlineBefore };
  loggerIo: LoggerIo;
}>;
type InitiateKlinesRefError = GeneralError<'InitiateKlinesRefFailed'>;
function initiateKlinesRef(
  deps: InitiateKlinesRefDeps,
  btStrategy: BtStrategyModel,
): te.TaskEither<InitiateKlinesRefError, ior.IORef<ReadonlyNonEmptyArray<Kline>>> {
  const { klineDao, loggerIo } = deps;

  function getInitKlines(btStrategy: BtStrategyModel) {
    const filter = {
      exchange: btStrategy.exchange,
      symbol: btStrategy.symbol,
      timeframe: btStrategy.timeframe,
      start: btStrategy.startTimestamp,
    };
    const limit = btStrategy.maxNumKlines;

    return pipe(
      klineDao.getBefore(filter, limit),
      te.chainFirstIOK((klines) =>
        loggerIo.infoIo(
          `Got ${klines.length} klines of ${filter.symbol} before ${filter.start.toISOString()}`,
        ),
      ),
      te.mapLeft((error) =>
        createGeneralError(
          'InitiateKlinesRefFailed',
          `Getting klines before ${filter.start.toISOString()} failed`,
          error,
        ),
      ),
      te.map(readonlyNonEmptyArray.fromReadonlyArray),
      te.chainW((initKlines) => {
        if (o.isSome(initKlines)) return te.right(initKlines.value);
        else
          return pipe(
            klineDao.getFirstBefore({ ...filter, start: btStrategy.endTimestamp }),
            te.mapLeft((error) =>
              createGeneralError(
                'InitiateKlinesRefFailed',
                `Getting first kline before ${filter.start.toISOString()} failed`,
                error,
              ),
            ),
            te.chainW(
              te.fromPredicate(isNotNil, () =>
                createGeneralError('InitiateKlinesRefFailed', `There is no kline of ${filter.symbol}`),
              ),
            ),
            te.chainFirstIOK((firstKline) =>
              loggerIo.infoIo(
                `The first kline of ${filter.symbol} is closed at ${firstKline.closeTimestamp.toISOString()}`,
              ),
            ),
            te.map(readonlyNonEmptyArray.of),
          );
      }),
    );
  }

  return pipe(
    getInitKlines(btStrategy),
    te.chainIOK((initKlines) => ior.newIORef(initKlines)),
  );
}

function initiateStrategyModuleRef(btStrategy: BtStrategyModel, symbol: Symbol): ior.IORef<StrategyModule> {
  const assetCurrency = mapCapitalCurrencyToAssetCurrency(btStrategy.capitalCurrency, symbol);
  return new ior.IORef(initiateStrategyModule({ ...btStrategy, assetCurrency }, symbol));
}

function initiateOrdersRef(): ior.IORef<OrdersLists> {
  return new ior.IORef({
    openingOrders: [],
    submittedOrders: [],
    triggeredOrders: [],
    filledOrders: [],
    canceledOrders: [],
    rejectedOrders: [],
  });
}

function initiateTradesRef(): ior.IORef<TradesLists> {
  return new ior.IORef({ openingTrades: [], closedTrades: [] });
}

export function handleBacktestSucceeded(deps: {
  job: Job<BtJobData>;
  agenda: Agenda;
  loggerIo: LoggerIo;
  logsRef: ior.IORef<readonly string[]>;
  ordersRef: ior.IORef<OrdersLists>;
  tradesRef: ior.IORef<TradesLists>;
  strategyModuleRef: ior.IORef<StrategyModule>;
}): t.Task<void> {
  return () => {
    const { job, agenda, ordersRef, tradesRef, strategyModuleRef, logsRef, loggerIo } = deps;

    loggerIo.info(`Backtesting successfully done`);

    job.attrs.data.status = btExecutionStatusEnum.FINISHED;
    job.attrs.data.percentage = BT_PROGRESS_PERCENTAGE_FINISHED;
    job.attrs.result = {
      logs: logsRef.read(),
      orders: ordersRef.read(),
      trades: tradesRef.read(),
      strategyModule: strategyModuleRef.read(),
    };

    return saveJobThenStopAgenda({ job, agenda }).catch(() => process.exit(1));
  };
}

export function handleBacktestFailed<E extends AppError>(
  deps: { job: Job<BtJobData>; agenda: Agenda; loggerIo: LoggerIo; logsRef: ior.IORef<readonly string[]> },
  appError: E,
): t.Task<void> {
  return () => {
    const { job, agenda, loggerIo, logsRef } = deps;

    loggerIo.info(`Backtesting failed`);

    job.attrs.data.status = btExecutionStatusEnum.FAILED;
    job.attrs.failReason = appError.toString();
    job.attrs.result = { logs: logsRef.read(), error: appError.toJSON() };

    return saveJobThenStopAgenda({ job, agenda }).catch(() => process.exit(1));
  };
}
