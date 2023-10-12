import { Job } from 'agenda';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import ior from 'fp-ts/lib/IORef.js';
import o from 'fp-ts/lib/Option.js';
import readonlyNonEmptyArray, { ReadonlyNonEmptyArray } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, drop, isNotNil, mergeRight } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { ExchangeName } from '#features/shared/exchange.js';
import { Kline } from '#features/shared/kline.js';
import { OrderId, PendingOrderRequest } from '#features/shared/order.js';
import { mapCapitalCurrencyToAssetCurrency } from '#features/shared/strategy.js';
import { ExecuteStrategy, ExecuteStrategyError } from '#features/shared/strategyExecutor/executeStrategy.js';
import { OrdersLists, StopStrategyExecutor, TradesLists } from '#features/shared/strategyExecutor/service.js';
import { buildKlinesModule } from '#features/shared/strategyExecutorModules/klines.js';
import { buildOrdersModule } from '#features/shared/strategyExecutorModules/orders.js';
import {
  StrategyModule,
  initiateStrategyModule,
  updateStrategyModuleStats,
} from '#features/shared/strategyExecutorModules/strategy.js';
import { buildSystemModule } from '#features/shared/strategyExecutorModules/system.js';
import { buildTechnicalAnalysisModule } from '#features/shared/strategyExecutorModules/technicalAnalysis.js';
import { buildTradesModules } from '#features/shared/strategyExecutorModules/trades.js';
import { Symbol, SymbolName } from '#features/shared/symbol.js';
import { TradeId, updateOpeningTradeStats } from '#features/shared/trade.js';
import { SymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { LoggerIo } from '#infra/logging.js';
import { DateService } from '#infra/services/date/service.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { executeIo } from '#shared/utils/fp.js';

import { BtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import {
  AddKlines,
  CreateKlinesIteratorError,
  GetFirstBefore,
  GetKlinesBefore,
  GetNextKlineIterationError,
  IterateThroughKlines,
} from '../DAOs/kline.feature.js';
import { BtStrategyId, BtStrategyModel } from '../dataModels/btStrategy.js';
import { GetKlinesForBt } from '../services/binance/getKlinesForBt.js';
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
    getBefore: GetKlinesBefore;
    getFirstBefore: GetFirstBefore;
    iterateThroughKlines: IterateThroughKlines;
  };
  symbolDao: {
    getByNameAndExchange: (
      name: SymbolName,
      exchange: ExchangeName,
    ) => te.TaskEither<SymbolDaoError<'GetByNameAndExchangeFailed' | 'NotExist'>, Symbol>;
  };
  strategyExecutor: { execute: ExecuteStrategy; stopVm: StopStrategyExecutor };
}>;
export function backtest(deps: BacktestDeps) {
  const {
    job,
    loggerIo,
    btStrategyDao,
    klineDao,
    symbolDao,
    bnbService,
    generateOrderId,
    generateTradeId,
    strategyExecutor,
  } = deps;

  const btStrategyId = job.attrs.data.btStrategyId;
  const executionId = job.attrs.data.id;

  function getBtStrategy() {
    return pipe(
      btStrategyDao.getById(btStrategyId),
      te.chainFirstIOK(() => loggerIo.infoIo('Got backtesting strategy from database')),
    );
  }
  function getKlinesFromExchange({ btStrategy }: { btStrategy: BtStrategyModel }) {
    return pipe(
      bnbService.getKlinesForBt({
        executionId,
        symbol: btStrategy.symbol,
        timeframe: btStrategy.timeframe,
        maxKlinesNum: btStrategy.maxNumKlines,
        startTimestamp: btStrategy.startTimestamp,
        endTimestamp: btStrategy.endTimestamp,
      }),
      te.chainFirstIOK((klines) =>
        loggerIo.infoIo(`Got ${klines.length} klines of ${btStrategy.symbol} from ${btStrategy.exchange}`),
      ),
      te.chainW(klineDao.add),
      te.chainFirstIOK(() => loggerIo.infoIo(`Added klines to database`)),
    );
  }
  function getSymbol(btStrategy: BtStrategyModel) {
    return pipe(
      symbolDao.getByNameAndExchange(btStrategy.symbol, btStrategy.exchange),
      te.chainFirstIOK(() => loggerIo.infoIo(`Got ${btStrategy.symbol} symbol from database`)),
    );
  }
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
      te.map(readonlyNonEmptyArray.fromReadonlyArray),
      te.chainW((initKlines) => {
        if (o.isSome(initKlines)) return te.right(initKlines.value);
        else
          return pipe(
            klineDao.getFirstBefore({ ...filter, start: btStrategy.endTimestamp }),
            te.chainW(
              te.fromPredicate(isNotNil, () =>
                createGeneralError('BacktestFailed', `There is no kline of ${filter.symbol}`),
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

  type Refs = {
    klinesRef: ior.IORef<ReadonlyNonEmptyArray<Kline>>;
    ordersRef: ior.IORef<OrdersLists>;
    tradesRef: ior.IORef<TradesLists>;
    strategyModuleRef: ior.IORef<StrategyModule>;
  };
  function createRefs(
    btStrategy: BtStrategyModel,
    symbol: Symbol,
    initKlines: ReadonlyNonEmptyArray<Kline>,
  ): Refs {
    const assetCurrency = mapCapitalCurrencyToAssetCurrency(btStrategy.capitalCurrency, symbol);

    const klinesRef = new ior.IORef(initKlines);
    const ordersRef = new ior.IORef<OrdersLists>({
      openingOrders: [],
      submittedOrders: [],
      triggeredOrders: [],
      filledOrders: [],
      canceledOrders: [],
      rejectedOrders: [],
    });
    const tradesRef = new ior.IORef<TradesLists>({ openingTrades: [], closedTrades: [] });
    const strategyModuleRef = new ior.IORef<StrategyModule>(
      initiateStrategyModule({ ...btStrategy, assetCurrency }, symbol),
    );

    return { klinesRef, ordersRef, tradesRef, strategyModuleRef };
  }

  return pipe(
    te.Do,
    te.bindW('btStrategy', getBtStrategy),
    te.chainFirstW(getKlinesFromExchange),
    te.bindW('symbol', ({ btStrategy }) => getSymbol(btStrategy)),
    te.bindW('initKlines', ({ btStrategy }) => getInitKlines(btStrategy)),
    te.let('refs', ({ btStrategy, symbol, initKlines }) => createRefs(btStrategy, symbol, initKlines)),
    te.chainW(({ btStrategy, symbol, refs }) =>
      pipe(
        () => {
          return new Promise<
            e.Either<OnEachCallbackError | CreateKlinesIteratorError | GetNextKlineIterationError, Refs>
          >((resolve) => {
            const klinesFilter = {
              exchange: btStrategy.exchange,
              symbol: btStrategy.symbol,
              timeframe: btStrategy.timeframe,
              start: btStrategy.startTimestamp,
              end: btStrategy.endTimestamp,
            };
            const onEachDeps = { generateOrderId, generateTradeId, strategyExecutor, ...refs };
            const callbackFns = {
              onEach: onEachCallback(onEachDeps, btStrategy, symbol),
              onFinish: () => resolve(e.right(refs)),
              onError: (error: OnEachCallbackError | GetNextKlineIterationError) => () =>
                resolve(e.left(error)),
            };

            pipe(
              klineDao.iterateThroughKlines(klinesFilter, callbackFns),
              ioe.mapLeft((error) => resolve(e.left(error))),
              executeIo,
            );
          });
        },
        te.orElseFirstIOK((error) => loggerIo.errorIo(`Strategy execution failed: ${error.toString()}`)),
        t.chainFirstIOK(() =>
          pipe(
            strategyExecutor.stopVm,
            io.chain(() => loggerIo.infoIo(`Isolated VM has been stopped`)),
          ),
        ),
      ),
    ),
  );
}

export type OnEachCallbackDeps = DeepReadonly<{
  generateOrderId: io.IO<OrderId>;
  generateTradeId: io.IO<TradeId>;
  strategyExecutor: { execute: ExecuteStrategy };
  klinesRef: ior.IORef<ReadonlyNonEmptyArray<Kline>>;
  ordersRef: ior.IORef<OrdersLists>;
  tradesRef: ior.IORef<TradesLists>;
  strategyModuleRef: ior.IORef<StrategyModule>;
}>;
type OnEachCallbackError = ExecuteStrategyError | ProcessOpeningOrdersError | ProcessTriggeredOrdersError;
export function onEachCallback(deps: OnEachCallbackDeps, btStrategy: BtStrategyModel, symbol: Symbol) {
  const {
    strategyExecutor,
    generateOrderId,
    generateTradeId,
    klinesRef,
    ordersRef,
    tradesRef,
    strategyModuleRef,
  } = deps;
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

  return (currentKline: Kline): te.TaskEither<OnEachCallbackError, void> =>
    pipe(
      // loggerIo.infoIo(`Start process kline that closes at ${currentKline.closeTimestamp.toISOString()}`),
      klinesRef.modify(appendToFixedMaxSizeArray(currentKline)),
      io.bind('klines', () => klinesRef.read),
      io.let('dateService', () => ({ getCurrentDate: io.of(currentKline.closeTimestamp) })),
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
}
