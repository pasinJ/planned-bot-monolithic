import * as te from 'fp-ts/lib/TaskEither';

import { Symbol } from '../domain/symbol.valueObject';
import { SymbolRepoError } from './symbol.error';

export type SymbolRepo = {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments
  getSymbols: te.TaskEither<SymbolRepoError<'GetSymbolsError'>, readonly Symbol[]>;
};
