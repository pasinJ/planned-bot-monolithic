import te from 'fp-ts/lib/TaskEither.js';
import { constVoid, pipe } from 'fp-ts/lib/function.js';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange.js';
import { SymbolModelDaoError } from '#features/symbols/data-models/symbol.dao.error.js';
import { SymbolModelDao } from '#features/symbols/data-models/symbol.dao.type.js';
import { LoggerIo } from '#infra/logging.js';
import { BnbServiceError } from '#infra/services/binance/error.js';
import { BnbService } from '#infra/services/binance/service.type.js';
import { getAppConfig } from '#shared/app.config.js';

export type StartupProcessDeps = {
  bnbService: Pick<BnbService, 'getSpotSymbols'>;
  symbolModelDao: Pick<SymbolModelDao, 'existByExchange' | 'add'>;
  logger: LoggerIo;
};

export function startupProcess(
  deps: StartupProcessDeps,
): te.TaskEither<
  SymbolModelDaoError<'ExistByExchangeFailed' | 'AddFailed'> | BnbServiceError<'GetSpotSymbolsFailed'>,
  void
> {
  const { logger } = deps;
  return pipe(
    te.fromIO(logger.infoIo('Starting startup process')),
    te.chain(() => fetchSpotBinanceSymbols(deps)),
    te.chainFirstIOK(() => logger.infoIo('Startup process done')),
  );
}

function fetchSpotBinanceSymbols(deps: StartupProcessDeps) {
  const { bnbService, symbolModelDao, logger } = deps;
  const { ENV } = getAppConfig();

  if (ENV.includes('test')) {
    return te.fromIO(logger.infoIo('Skip fetching SPOT symbols b/c running in test environment'));
  } else {
    return pipe(
      symbolModelDao.existByExchange(exchangeNameEnum.BINANCE),
      te.chainW((exist) =>
        exist
          ? te.rightIO(constVoid)
          : pipe(bnbService.getSpotSymbols, te.chainW(symbolModelDao.add), te.map(constVoid)),
      ),
    );
  }
}
