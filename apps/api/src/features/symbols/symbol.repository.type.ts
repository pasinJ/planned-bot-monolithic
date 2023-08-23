import te from 'fp-ts/lib/TaskEither.js';

import { ErrorBase, ExternalError } from '#shared/error.js';

import { Symbol } from './domain/symbol.entity.js';

export type SymbolRepository = {
  add: (symbols: Symbol | readonly Symbol[]) => te.TaskEither<AddSymbolsError, void>;
  getAll: te.TaskEither<GetAllSymbolsError, readonly Symbol[]>;
  countAll: te.TaskEither<CountAllSymbolsError, number>;
};

export class CreateSymbolRepositoryError extends ErrorBase<
  'CREATE_SCHEMA_ERROR' | 'CREATE_MODEL_ERROR',
  ExternalError
> {}
export class GetSymbolRepositoryError extends ErrorBase<'NOT_INITIATED_ERROR', never> {}
export class AddSymbolsError extends ErrorBase<'ADD_SYMBOLS_ERROR', ExternalError> {}
export class GetAllSymbolsError extends ErrorBase<'GET_ALL_SYMBOLS_ERROR', ExternalError> {}
export class CountAllSymbolsError extends ErrorBase<'COUNT_ALL_SYMBOLS_ERROR', ExternalError> {}
