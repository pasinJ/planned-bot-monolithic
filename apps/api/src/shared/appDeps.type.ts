import { BtStrategyModelDao } from '#features/backtesting-strategies/data-models/btStrategy.dao.type.js';
import { SymbolModelDao } from '#features/symbols/data-models/symbol.dao.type.js';
import { BnbService } from '#infra/services/binance/service.type.js';
import { DateService } from '#infra/services/date/service.type.js';
import { JobScheduler } from '#infra/services/jobScheduler/service.type.js';

export type AppDeps = {
  bnbService: BnbService;
  dateService: DateService;
  symbolModelDao: SymbolModelDao;
  btStrategyModelDao: BtStrategyModelDao;
  jobScheduler: JobScheduler;
};
