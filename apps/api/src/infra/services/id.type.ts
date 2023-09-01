import io from 'fp-ts/lib/IO.js';

import { BtStrategyId } from '#features/backtesting-strategies/domain/btStrategy.entity.js';
import { SymbolId } from '#features/symbols/domain/symbol.entity.js';

export type IdService = {
  generateSymbolId: io.IO<SymbolId>;
  generateBtStrategyId: io.IO<BtStrategyId>;
};
