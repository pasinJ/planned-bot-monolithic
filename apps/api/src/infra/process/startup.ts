import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';
import { constVoid, pipe } from 'fp-ts/lib/function.js';

import { ExchangeName, exchangeNameEnum } from '#features/shared/exchange.js';
import { Symbol } from '#features/shared/symbol.js';
import { SymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { LoggerIo } from '#infra/logging.js';
import { BnbServiceError } from '#infra/services/binance/error.js';
import { Env } from '#shared/app.config.js';

export type StartupProcessDeps = {
  bnbService: {
    getSpotSymbolsList: te.TaskEither<BnbServiceError<'GetSpotSymbolsFailed'>, readonly Symbol[]>;
  };
  symbolDao: {
    existByExchange: (
      exchange: ExchangeName,
    ) => te.TaskEither<SymbolDaoError<'ExistByExchangeFailed'>, boolean>;
    add: (symbols: Symbol | readonly Symbol[]) => te.TaskEither<SymbolDaoError<'AddFailed'>, void>;
  };
  loggerIo: LoggerIo;
  getAppConfig: io.IO<{ ENV: Env }>;
};

export function startupProcess(
  deps: StartupProcessDeps,
): te.TaskEither<
  SymbolDaoError<'ExistByExchangeFailed' | 'AddFailed'> | BnbServiceError<'GetSpotSymbolsFailed'>,
  void
> {
  const { loggerIo } = deps;
  return pipe(
    te.fromIO(loggerIo.infoIo('Starting startup process')),
    te.chain(() => fetchSpotBinanceSymbols(deps)),
    te.chainFirstIOK(() => loggerIo.infoIo('Startup process done')),
  );
}

function fetchSpotBinanceSymbols(deps: StartupProcessDeps) {
  const { bnbService, symbolDao, loggerIo } = deps;

  return pipe(
    deps.getAppConfig,
    te.fromIO,
    te.chain(({ ENV }) => {
      if (ENV.includes('test')) {
        return te.fromIO(loggerIo.infoIo('Skip fetching SPOT symbols b/c running in test environment'));
      } else {
        return pipe(
          symbolDao.existByExchange(exchangeNameEnum.BINANCE),
          te.chainW((exist) =>
            exist
              ? te.rightIO(constVoid)
              : pipe(bnbService.getSpotSymbolsList, te.chainW(symbolDao.add), te.map(constVoid)),
          ),
        );
      }
    }),
  );
}
