import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';

import { Symbol, SymbolId } from '../domain/symbol.entity.js';
import { SymbolRepoError } from './symbol.error.js';

export type SymbolRepo = {
  generateId: io.IO<SymbolId>;
  add: <S extends Symbol | readonly Symbol[]>(
    symbols: S,
  ) => te.TaskEither<SymbolRepoError<'AddSymbolError'>, S>;
  getAll: te.TaskEither<SymbolRepoError<'GetAllSymbolsError'>, readonly Symbol[]>;
  countAll: te.TaskEither<SymbolRepoError<'CountAllSymbolsError'>, number>;
};
