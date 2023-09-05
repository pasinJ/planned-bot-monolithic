import te from 'fp-ts/lib/TaskEither.js';
import { constVoid, pipe } from 'fp-ts/lib/function.js';

import { SymbolRepoError } from '#features/symbols/repositories/symbol.error.js';
import { SymbolRepo } from '#features/symbols/repositories/symbol.type.js';
import { LoggerIo } from '#infra/logging.js';
import { BnbServiceError } from '#infra/services/binance/error.js';
import { BnbService } from '#infra/services/binance/service.type.js';
import { getAppConfig } from '#shared/config/app.js';

type StartupProcessDeps = { bnbService: BnbService; symbolRepo: SymbolRepo; logger: LoggerIo };
type StartupError =
  | SymbolRepoError<'CountAllSymbolsError' | 'AddSymbolError'>
  | BnbServiceError<'GetBnbSpotSymbolsError'>;

export function startupProcess(deps: StartupProcessDeps): te.TaskEither<StartupError, void> {
  const { logger } = deps;
  return pipe(
    te.fromIO(logger.infoIo('Starting startup process')),
    te.chain(() => fetchSpotSymbols(deps)),
    te.chainFirstIOK(() => logger.infoIo('Startup process done')),
  );
}

function fetchSpotSymbols(deps: StartupProcessDeps) {
  const { bnbService, symbolRepo, logger } = deps;
  const { ENV } = getAppConfig();

  if (ENV.includes('test')) {
    return te.fromIO(logger.infoIo('Skip fetching SPOT symbols b/c running in test environment'));
  } else {
    return pipe(
      symbolRepo.countAll,
      te.chainW((existing) =>
        existing !== 0
          ? te.rightIO(constVoid)
          : pipe(bnbService.getSpotSymbols, te.chainW(symbolRepo.add), te.map(constVoid)),
      ),
    );
  }
}
