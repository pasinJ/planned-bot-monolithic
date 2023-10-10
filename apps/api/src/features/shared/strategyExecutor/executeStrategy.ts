import { transform } from '@swc/core';
import { ReadonlyNonEmptyArray } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Context, Isolate, Reference } from 'isolated-vm';
import { DeepReadonly } from 'ts-essentials';

import { LoggerIo } from '#infra/logging.js';
import { DateService } from '#infra/services/date/service.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';
import { TimezoneString } from '#shared/utils/string.js';

import { Kline } from '../kline.js';
import { PendingOrderRequest } from '../order.js';
import { Language, StrategyBody } from '../strategy.js';
import { KlinesModule } from '../strategyExecutorModules/klines.js';
import { OrdersModule } from '../strategyExecutorModules/orders.js';
import { StrategyModule } from '../strategyExecutorModules/strategy.js';
import { SystemModule } from '../strategyExecutorModules/system.js';
import { TechnicalAnalysisModule } from '../strategyExecutorModules/technicalAnalysis.js';
import { TradesModule } from '../strategyExecutorModules/trades.js';
import { StrategyExecutorError, createStrategyExecutorError } from './error.js';
import { OrdersLists, StrategyExecutorContext, TradesLists, importObjIntoContext } from './service.js';

export type ExecutorModules = {
  klinesModule: KlinesModule;
  ordersModule: OrdersModule;
  tradesModule: TradesModule;
  strategyModule: StrategyModule;
  technicalAnalysisModule: TechnicalAnalysisModule;
  systemModule: SystemModule;
};

export type ExecuteStrategy = (
  body: StrategyBody,
  language: Language,
  modules: ExecutorModules,
) => te.TaskEither<ExecuteStrategyError, DeepReadonly<readonly PendingOrderRequest[]>>;
export type ExecuteStrategyRequest = {
  klines: ReadonlyNonEmptyArray<Kline>;
  orders: OrdersLists;
  trades: TradesLists;
  strategyModule: StrategyModule;
  dateService: DateService;

  timezone: TimezoneString;
};
export type ExecuteStrategyError = StrategyExecutorError<'ExecuteFailed'>;
export function executeStrategy({
  sandbox,
  context,
  loggerIo,
}: {
  sandbox: Isolate;
  context: Context;
  loggerIo: LoggerIo;
}): ExecuteStrategy {
  return (body, language, modules) => {
    const swcConfig = { jsc: { parser: { syntax: 'typescript' } }, minify: true } as const;
    const {
      klinesModule,
      ordersModule,
      tradesModule,
      strategyModule,
      technicalAnalysisModule,
      systemModule,
    } = modules;

    return pipe(
      te.tryCatch(
        () =>
          Promise.all([
            importObjIntoContext('klines', klinesModule, context.global),
            importObjIntoContext('orders', ordersModule, context.global),
            importObjIntoContext('trades', tradesModule, context.global),
            importObjIntoContext('strategy', strategyModule, context.global),
            importObjIntoContext('ta', technicalAnalysisModule, context.global),
            importObjIntoContext('system', systemModule, context.global),
          ]),
        createErrorFromUnknown(
          createStrategyExecutorError('ExecuteFailed', 'Adding executor modules to isolated VM failed'),
        ),
      ),
      te.chainW(() =>
        te.tryCatch(
          async () => (language === 'javascript' ? body : (await transform(body, swcConfig)).code),
          createErrorFromUnknown(
            createStrategyExecutorError('ExecuteFailed', 'Transforming strategy body failed'),
          ),
        ),
      ),
      te.chainW((code) =>
        te.tryCatch(
          () => sandbox.compileScript(code).then((script) => script.run(context)),
          createErrorFromUnknown(
            createStrategyExecutorError('ExecuteFailed', 'Executing strategy body failed'),
          ),
        ),
      ),
      te.orElseFirstIOK((error) =>
        loggerIo.errorIo(`Strategy execution failed with error: ${error.toString()}`),
      ),
      te.chainW(() =>
        te.tryCatch(
          async () => {
            const globaContext = context.global as Reference<StrategyExecutorContext>;
            const orderModule = await globaContext.get('orders');
            const getPendingOrders = await orderModule.get('getPendingOrders');
            return getPendingOrders();
          },
          createErrorFromUnknown(
            createStrategyExecutorError(
              'ExecuteFailed',
              'Getting pending order requests out from isolated VM failed',
            ),
          ),
        ),
      ),
    );
  };
}
