import { BtStrategyModelDao } from '#features/backtesting-strategies/data-models/btStrategy.dao.type.js';
import type { BtStrategyRepo } from '#features/backtesting-strategies/repositories/btStrategy.type.js';
import type { SymbolRepo } from '#features/symbols/repositories/symbol.type.js';

import type { BnbService } from './services/binance/service.type.js';
import type { DateService } from './services/date.type.js';
import { JobScheduler } from './services/jobScheduler/service.type.js';

export type ApplicationDeps = {
  bnbService: BnbService;
  dateService: DateService;
  symbolRepo: SymbolRepo;
  btStrategyRepo: BtStrategyRepo;
  btStrategyModelDao: BtStrategyModelDao;
  jobScheduler: JobScheduler;
};
