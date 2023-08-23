import te from 'fp-ts/lib/TaskEither.js';
import { constVoid, pipe } from 'fp-ts/lib/function.js';

import {
  AddSymbolsError,
  CountAllSymbolsError,
  SymbolRepository,
} from '#features/symbols/symbol.repository.type.js';
import { LoggerIo } from '#infra/logging.js';
import { BnbService, GetBnbSpotSymbolsError } from '#infra/services/binance.type.js';
import { getAppConfig } from '#shared/config/app.js';

type StartupProcessDeps = { bnbService: BnbService; symbolRepository: SymbolRepository; logger: LoggerIo };
type StartupError = CountAllSymbolsError | GetBnbSpotSymbolsError | AddSymbolsError;

export function startupProcess(deps: StartupProcessDeps): te.TaskEither<StartupError, void> {
  const { logger } = deps;
  return pipe(
    te.fromIO(logger.infoIo('Starting startup process')),
    te.chain(() => fetchSpotSymbols(deps)),
    te.chainFirstIOK(() => logger.infoIo('Startup process done')),
  );
}

function fetchSpotSymbols(deps: StartupProcessDeps) {
  const { bnbService, symbolRepository, logger } = deps;
  const { ENV } = getAppConfig();

  if (ENV.includes('test')) {
    return te.fromIO(logger.infoIo('Skip fetching SPOT symbols b/c running in test environment'));
  } else {
    return pipe(
      symbolRepository.countAll,
      te.chainW((existing) =>
        existing !== 0
          ? te.rightIO(constVoid)
          : pipe(bnbService.getSpotSymbols, te.chainW(symbolRepository.add), te.map(constVoid)),
      ),
    );
  }
}
