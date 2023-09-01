import te from 'fp-ts/lib/TaskEither.js';

import { CustomError, ExternalError } from '#shared/error.js';

import { Symbol } from './domain/symbol.entity.js';

export type SymbolRepo = {
  add: <S extends Symbol | readonly Symbol[]>(symbols: S) => te.TaskEither<AddSymbolsError, S>;
  getAll: te.TaskEither<GetAllSymbolsError, readonly Symbol[]>;
  countAll: te.TaskEither<CountAllSymbolsError, number>;
};

export class CreateSymbolRepoError extends CustomError<
  'CREATE_REPO_ERROR' | 'CREATE_SCHEMA_ERROR' | 'CREATE_MODEL_ERROR',
  ExternalError
>('CREATE_REPO_ERROR', 'Error happened when try to create symbol repository') {}

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
