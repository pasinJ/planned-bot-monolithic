import te from 'fp-ts/lib/TaskEither.js';

import { CustomError, ExternalError } from '#shared/error.js';

import { Symbol } from './domain/symbol.entity.js';

export type SymbolRepository = {
  add: (symbols: Symbol | readonly Symbol[]) => te.TaskEither<AddSymbolsError, void>;
  getAll: te.TaskEither<GetAllSymbolsError, readonly Symbol[]>;
  countAll: te.TaskEither<CountAllSymbolsError, number>;
};

export class CreateSymbolRepositoryError extends CustomError<
  'CREATE_SYMBOL_REPO_ERROR' | 'CREATE_SCHEMA_ERROR' | 'CREATE_MODEL_ERROR',
  ExternalError
>('CREATE_SYMBOL_REPO_ERROR', 'Error happened when try to create symbol repository') {}

export class GetSymbolRepositoryError extends CustomError<'NOT_INITIATED_ERROR', ExternalError>(
  'NOT_INITIATED_ERROR',
  'The symbol repository has not been initiated',
) {}

export class AddSymbolsError extends CustomError<'ADD_SYMBOLS_ERROR', ExternalError>(
  'ADD_SYMBOLS_ERROR',
  'Error happened when try to add symbols',
) {}

export class GetAllSymbolsError extends CustomError<'GET_ALL_SYMBOLS_ERROR', ExternalError>(
  'GET_ALL_SYMBOLS_ERROR',
  'Error happened when try to get all symbols',
) {}

export class CountAllSymbolsError extends CustomError<'COUNT_ALL_SYMBOLS_ERROR', ExternalError>(
  'COUNT_ALL_SYMBOLS_ERROR',
  'Error happened when try to count all symbols',
) {}
