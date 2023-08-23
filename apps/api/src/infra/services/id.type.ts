import io from 'fp-ts/lib/IO.js';

import { SymbolId } from '#features/symbols/domain/symbol.entity.js';

export type IdService = {
  generateSymbolId: io.IO<SymbolId>;
};
