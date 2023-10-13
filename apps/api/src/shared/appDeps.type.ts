import { BtExecutionDao } from '#features/btStrategies/DAOs/btExecution.js';
import { BtStrategyDao } from '#features/btStrategies/DAOs/btStrategy.js';
import { SymbolDao } from '#features/symbols/DAOs/symbol.js';
import { BnbService } from '#infra/services/binance/service.js';
import { DateService } from '#infra/services/date/service.js';
import { JobScheduler } from '#infra/services/jobScheduler/service.js';

export type AppDeps = Readonly<{
  dateService: DateService;
  bnbService: BnbService;
  jobScheduler: JobScheduler;
  symbolDao: SymbolDao;
  btStrategyDao: BtStrategyDao;
  btExecutionDao: BtExecutionDao;
}>;
