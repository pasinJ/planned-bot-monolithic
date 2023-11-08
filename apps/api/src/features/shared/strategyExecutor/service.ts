import io from 'fp-ts/lib/IO.js';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Isolate } from 'isolated-vm';
import fs from 'node:fs/promises';
import path, { join } from 'node:path';
import * as ramda from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { LoggerIo } from '#infra/logging.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { KlinesModule } from '../strategyExecutorContext/klines.js';
import { OrdersModule } from '../strategyExecutorContext/orders.js';
import { StrategyModule } from '../strategyExecutorContext/strategy.js';
import { SystemModule } from '../strategyExecutorContext/system.js';
import { TechnicalAnalysisModule } from '../strategyExecutorContext/technicalAnalysis.js';
import { TradesModule } from '../strategyExecutorContext/trades.js';
import { StrategyExecutorConfig } from './config.js';
import { StrategyExecutorError, createStrategyExecutorError } from './error.js';
import { ExecuteStrategy, executeStrategy } from './executeStrategy.js';
import { importObjIntoVm } from './importObjIntoVm.js';
import { ivm } from './isolatedVm.js';

const __dirname = new URL('.', import.meta.url).pathname;
const LIBS_DIR_PATH = join(__dirname, '../../../libs/');

export type StrategyExecutor = Readonly<{ execute: ExecuteStrategy; stop: StopStrategyExecutor }>;
export type StrategyExecutorContext = {
  ramda: typeof ramda;
  console: Console;
  klines: KlinesModule;
  orders: OrdersModule;
  trades: TradesModule;
  strategy: StrategyModule;
  ta: TechnicalAnalysisModule;
  system: SystemModule;
};

export type StartStrategyExecutor = (
  deps: StartStrategyExecutorDeps,
) => te.TaskEither<StartStrategyExecutorError, StrategyExecutor>;
export type StartStrategyExecutorError = StrategyExecutorError<'StartFailed'>;
export type StartStrategyExecutorDeps = DeepReadonly<{
  getConfig: io.IO<StrategyExecutorConfig>;
  isolatedConsole: Console;
  loggerIo: LoggerIo;
}>;
export function startStrategyExecutor(
  ...[deps]: Parameters<StartStrategyExecutor>
): ReturnType<StartStrategyExecutor> {
  const { getConfig, isolatedConsole, loggerIo } = deps;

  return pipe(
    te.fromIO(getConfig),
    te.chain((config) =>
      te.tryCatch(
        async () => {
          const sandbox = new ivm.Isolate();
          const context = await sandbox.createContext();
          const isolatedGlobal = context.global;

          await isolatedGlobal.set('global', context.global.derefInto());

          const libFiles = await fs.readdir(LIBS_DIR_PATH);
          await Promise.all(
            libFiles
              .filter((f) => f.endsWith('js'))
              .map(async (libFile) => {
                const libFilePath = path.join(LIBS_DIR_PATH, libFile);
                const libContent = await fs.readFile(libFilePath, 'utf8');
                return context.eval(libContent);
              }),
          );

          await importObjIntoVm('console', isolatedConsole, isolatedGlobal);

          return { sandbox, context, config };
        },
        createErrorFromUnknown(
          createStrategyExecutorError('StartFailed', 'Starting strategy executor failed'),
        ),
      ),
    ),
    te.map(
      ({ sandbox, context, config }) =>
        ({
          execute: executeStrategy({ context, timeout: config.EXECUTE_TIMEOUT_MS }),
          stop: stopStrategyExecutor({ sandbox, loggerIo }),
        }) as StrategyExecutor,
    ),
    te.chainFirstIOK(() => loggerIo.infoIo('Strategy executor has been started')),
    te.orElseFirstIOK((error) => loggerIo.errorIo(`Strategy executor failed to start: ${error.toString()}`)),
  );
}

type StopStrategyExecutor = ioe.IOEither<StopStrategyExecutorError, void>;
export type StopStrategyExecutorError = StrategyExecutorError<'StopFailed'>;
function stopStrategyExecutor({
  sandbox,
  loggerIo,
}: {
  sandbox: Isolate;
  loggerIo: LoggerIo;
}): StopStrategyExecutor {
  return pipe(
    ioe.tryCatch(
      () => (!sandbox.isDisposed ? sandbox.dispose() : undefined),
      createErrorFromUnknown(createStrategyExecutorError('StopFailed', 'Stopping strategy executor failed')),
    ),
    ioe.chainFirstIOK(() => loggerIo.infoIo('Strategy executor has been stopped')),
    ioe.orElseFirstIOK((error) => loggerIo.errorIo(`Strategy executor failed to stop: ${error.toString()}`)),
  );
}
