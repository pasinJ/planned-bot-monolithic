import type { BtStrategyRepo } from '#features/backtesting-strategies/repositories/btStrategy.type.js';
import type { SymbolRepo } from '#features/symbols/repositories/symbol.type.js';

import type { BnbService } from './services/binance/service.type.js';
import type { DateService } from './services/date.type.js';

export type ApplicationDeps = {
  bnbService: BnbService;
  dateService: DateService;
  symbolRepo: SymbolRepo;
  btStrategyRepo: BtStrategyRepo;
};
