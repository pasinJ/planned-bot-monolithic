import { transform } from '@swc/core';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Context, Reference } from 'isolated-vm';
import { DeepReadonly } from 'ts-essentials';

import { createErrorFromUnknown } from '#shared/errors/appError.js';

import {
  CanceledOrder,
  FilledOrder,
  OpeningOrder,
  PendingOrderRequest,
  RejectedOrder,
  SubmittedOrder,
  TriggeredOrder,
} from '../order.js';
import { Language, StrategyBody } from '../strategy.js';
import { KlinesModule } from '../strategyExecutorModules/klines.js';
import { OrdersModule } from '../strategyExecutorModules/orders.js';
import { StrategyModule } from '../strategyExecutorModules/strategy.js';
import { SystemModule } from '../strategyExecutorModules/system.js';
import { TradesModule } from '../strategyExecutorModules/trades.js';
import { ClosedTrade, OpeningTrade } from '../trade.js';
import { ExecuteStrategyTimeout } from './config.js';
import { StrategyExecutorError, createStrategyExecutorError } from './error.js';
import { importObjIntoVm } from './importObjIntoVm.js';
import type { StrategyExecutorContext } from './service.js';

export type ExecuteStrategy = (
  body: StrategyBody,
  language: Language,
  modules: ExecutorModules,
) => te.TaskEither<ExecuteStrategyError, DeepReadonly<readonly PendingOrderRequest[]>>;

export type ExecutorModules = {
  klinesModule: KlinesModule;
  ordersModule: OrdersModule;
  tradesModule: TradesModule;
  strategyModule: StrategyModule;
  systemModule: SystemModule;
};
export type OrdersLists = DeepReadonly<{
  openingOrders: OpeningOrder[];
  submittedOrders: SubmittedOrder[];
  triggeredOrders: TriggeredOrder[];
  filledOrders: FilledOrder[];
  canceledOrders: CanceledOrder[];
  rejectedOrders: RejectedOrder[];
}>;
export type TradesLists = DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>;

export type ExecuteStrategyError = StrategyExecutorError<'ExecuteFailed'>;

export function executeStrategy({
  context,
  timeout,
}: {
  context: Context;
  timeout: ExecuteStrategyTimeout;
}): ExecuteStrategy {
  return (body, language, modules) => {
    const { klinesModule, ordersModule, tradesModule, strategyModule, systemModule } = modules;
    const swcConfig = { jsc: { parser: { syntax: 'typescript' } }, minify: true } as const;

    const wrapInAsyncFunction = (code: string) => `(async () => { ${code} })()`;
    const loadModules = te.tryCatch(
      () =>
        Promise.all([
          importObjIntoVm('klines', klinesModule, context.global),
          importObjIntoVm('orders', ordersModule, context.global),
          importObjIntoVm('trades', tradesModule, context.global),
          importObjIntoVm('strategy', strategyModule, context.global),
          importObjIntoVm('system', systemModule, context.global),
        ]).then(() => context.eval(`global.ta = _ta.buildTechnicalAnalysisModule(klines.getAllRaw());`)),
      createErrorFromUnknown(
        createStrategyExecutorError('ExecuteFailed', 'Loading modules to isolated VM failed'),
      ),
    );
    const transformTypeScriptBody = te.tryCatch(
      () =>
        pipe(wrapInAsyncFunction(body), async (wrappedBody) =>
          language === 'javascript' ? wrappedBody : (await transform(wrappedBody, swcConfig)).code,
        ),
      createErrorFromUnknown(
        createStrategyExecutorError('ExecuteFailed', 'Transforming typescript body failed'),
      ),
    );
    const executeBody = (body: string) =>
      te.tryCatch(
        () => context.eval(body, { timeout }),
        createErrorFromUnknown(
          createStrategyExecutorError('ExecuteFailed', 'Executing strategy body failed'),
        ),
      );
    const getPendingOrderRequests = te.tryCatch(
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
    );

    return pipe(
      loadModules,
      te.chainW(() => transformTypeScriptBody),
      te.chainW(executeBody),
      te.chainW(() => getPendingOrderRequests),
    );
  };
}
