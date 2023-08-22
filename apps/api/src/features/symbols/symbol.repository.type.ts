import te from 'fp-ts/lib/TaskEither.js';

import { ErrorBase, ExternalError } from '#shared/error.js';

import { Symbol } from './domain/symbol.entity.js';

export type SymbolRepository = {
  add: (symbols: Symbol | Symbol[]) => te.TaskEither<AddSymbolsError, void>;
};

export class CreateSymbolRepositoryError extends ErrorBase<
  'CREATE_SCHEMA_ERROR' | 'CREATE_MODEL_ERROR',
  ExternalError
> {}
export class GetSymbolRepositoryError extends ErrorBase<'NOT_INITIATED_ERROR', never> {}
export class AddSymbolsError extends ErrorBase<'ADD_SYMBOLS_ERROR', ExternalError> {}
