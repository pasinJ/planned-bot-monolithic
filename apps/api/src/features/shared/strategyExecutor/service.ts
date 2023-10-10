import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Context, Isolate, Reference } from 'isolated-vm';
import fs from 'node:fs/promises';
import path from 'node:path';
import { toPairs } from 'ramda';
import * as ramda from 'ramda';
import { AnyFunction, DeepReadonly, Primitive } from 'ts-essentials';

import { LoggerIo } from '#infra/logging.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';
import { isFunction, isObject } from '#shared/utils/general.js';

import {
  CanceledOrder,
  FilledOrder,
  OpeningOrder,
  RejectedOrder,
  SubmittedOrder,
  TriggeredOrder,
} from '../order.js';
import { KlinesModule } from '../strategyExecutorModules/klines.js';
import { OrdersModule } from '../strategyExecutorModules/orders.js';
import { StrategyModule } from '../strategyExecutorModules/strategy.js';
import { SystemModule } from '../strategyExecutorModules/system.js';
import { TechnicalAnalysisModule } from '../strategyExecutorModules/technicalAnalysis.js';
import { TradesModule } from '../strategyExecutorModules/trades.js';
import { ClosedTrade, OpeningTrade } from '../trade.js';
import { StrategyExecutorError, createStrategyExecutorError } from './error.js';
import { ivm } from './isolatedVm.js';

export type OrdersLists = DeepReadonly<{
  openingOrders: OpeningOrder[];
  submittedOrders: SubmittedOrder[];
  triggeredOrders: TriggeredOrder[];
  filledOrders: FilledOrder[];
  canceledOrders: CanceledOrder[];
  rejectedOrders: RejectedOrder[];
}>;
export type TradesLists = DeepReadonly<{ openingTrades: OpeningTrade[]; closedTrades: ClosedTrade[] }>;

export type StrategyExecutor = Readonly<{
  composeWith: <R>(fn: (internal: { sandbox: Isolate; context: Context; loggerIo: LoggerIo }) => R) => R;
  stop: ioe.IOEither<StopStrategyExecutorError, void>;
}>;

export type StopStrategyExecutor = ioe.IOEither<StopStrategyExecutorError, void>;
export type StopStrategyExecutorError = StrategyExecutorError<'StopFailed'>;

export type StrategyExecutorDeps = { console: Console; loggerIo: LoggerIo };
export type CreateStrategyExecutorError = StrategyExecutorError<'CreateServiceFailed'>;
export function buildStrategyExecutor(
  deps: StrategyExecutorDeps,
): te.TaskEither<CreateStrategyExecutorError, StrategyExecutor> {
  const { console, loggerIo } = deps;

  const ramdaBundledFilePath = path.resolve('./src/libs/ramda.cjs');

  return pipe(
    te.Do,
    te.bindW('isolatedVm', () =>
      te.tryCatch(
        async () => {
          const sandbox = new ivm.Isolate();
          const context = await sandbox.createContext();

          await context.global.set('global', context.global.derefInto());

          const ramdaLib = await fs.readFile(ramdaBundledFilePath, 'utf8');
          await sandbox.compileScript(ramdaLib).then((script) => script.run(context));

          await importObjIntoContext('console', console, context.global);

          return { sandbox, context };
        },
        createErrorFromUnknown(
          createStrategyExecutorError('CreateServiceFailed', 'Creating strategy executor failed'),
        ),
      ),
    ),
    te.let('stop', ({ isolatedVm: { sandbox } }) =>
      ioe.tryCatch(
        () => {
          if (!sandbox.isDisposed) return sandbox.dispose();
        },
        createErrorFromUnknown(
          createStrategyExecutorError('CreateServiceFailed', 'Creating strategy executor failed'),
        ),
      ),
    ),
    te.map(
      ({ isolatedVm: { sandbox, context }, stop }) =>
        ({ composeWith: (fn) => fn({ sandbox, context, loggerIo }), stop }) as StrategyExecutor,
    ),
  );
}

export type StrategyExecutorContext = {
  ramda: RamdaModule;
  console: Console;
  klines: KlinesModule;
  orders: OrdersModule;
  trades: TradesModule;
  strategy: StrategyModule;
  ta: TechnicalAnalysisModule;
  system: SystemModule;
};
type RamdaModule = typeof ramda;

type AnyContext = Record<string | number | symbol, ContextValue>;
type ContextValue =
  | Primitive
  | AnyFunction
  | { [key: string | number | symbol]: ContextValue }
  | ContextValue[];

export async function importObjIntoContext<Name extends string | number | symbol>(
  name: Name,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: Record<string | number | symbol, any>,
  ref: Reference<AnyContext>,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
): Promise<void[]> {
  await ref.set(name, new ivm.ExternalCopy({}).copyInto());
  const objRef = (await ref.get(name)) as Reference<Record<string | number | symbol, ContextValue>>;

  return Promise.all(
    toPairs(obj).flatMap(([key, value]) => {
      if (isObject(value)) {
        return importObjIntoContext(key, value, objRef).then(() => undefined);
      } else if (isFunction(value)) {
        return objRef.set(key, (...args: unknown[]) => value(...args) as unknown);
      } else if (!isFunction(value)) {
        return objRef.set(key, value as Primitive, { copy: true });
      } else {
        return Promise.resolve(undefined);
      }
    }),
  );
}
