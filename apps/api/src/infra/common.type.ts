import type { SymbolRepository } from '#features/symbols/symbol.repository.type.js';

import type { BnbService } from './services/binance.type.js';
import type { DateService } from './services/date.type.js';
import type { IdService } from './services/id.type.js';

export type ApplicationDeps = {
  bnbService: BnbService;
  dateService: DateService;
  idService: IdService;
  symbolRepository: SymbolRepository;
};
