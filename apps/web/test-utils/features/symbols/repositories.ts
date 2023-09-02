import * as te from 'fp-ts/lib/TaskEither';

import { SymbolRepo } from '#features/symbols/repositories/symbol.type';

export function mockSymbolRepo(overrides?: Partial<SymbolRepo>): SymbolRepo {
  return { getSymbols: te.right([]), ...overrides };
}
