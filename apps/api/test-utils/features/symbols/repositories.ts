import te from 'fp-ts/lib/TaskEither.js';

import { SymbolRepo } from '#features/symbols/repositories/symbol.type.js';

export function mockSymbolRepo(overrides?: Partial<SymbolRepo>): SymbolRepo {
  return {
    add: (x) => te.of(x),
    getAll: te.right([]),
    countAll: te.right(0),
    ...overrides,
  };
}
