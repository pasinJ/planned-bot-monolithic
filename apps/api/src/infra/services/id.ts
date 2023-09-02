import { nanoid } from 'nanoid';

import { BtStrategyId } from '#features/backtesting-strategies/domain/btStrategy.entity.js';
import { SymbolId } from '#features/symbols/domain/symbol.entity.js';

import { IdService } from './id.type.js';

export const idService: IdService = {
  generateSymbolId: () => nanoid() as SymbolId,
  generateBtStrategyId: () => nanoid() as BtStrategyId,
};
