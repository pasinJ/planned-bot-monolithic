import ior from 'fp-ts/IORef';
import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { constVoid, pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';
import { isNotNil, omit } from 'ramda';

import { createErrorFromUnknown } from '#shared/error.js';

import { SymbolModel, createSymbolModel } from './symbol.model.js';
import {
  AddSymbolsError,
  CreateSymbolRepositoryError,
  GetAllSymbolsError,
  GetSymbolRepositoryError,
  SymbolRepository,
} from './symbol.repository.type.js';

const symbolRepository = new ior.IORef<SymbolRepository | undefined>(undefined);

export function createSymbolRepository(client: Mongoose): ioe.IOEither<CreateSymbolRepositoryError, void> {
  return pipe(
    createSymbolModel(client),
    ioe.map((model) => ({ add: buildAddSymbols(model), getAll: buildGetAll(model) })),
    ioe.chainIOK((repository) => symbolRepository.write(repository)),
  );
}

export const getSymbolRepository: ioe.IOEither<GetSymbolRepositoryError, SymbolRepository> = pipe(
  ioe.fromIO(symbolRepository.read),
  ioe.chain(
    ioe.fromPredicate(
      isNotNil,
      () => new GetSymbolRepositoryError('NOT_INITIATED_ERROR', 'Symbol repository has not been initiated'),
    ),
  ),
);

function buildAddSymbols(model: SymbolModel) {
  return function addSymbols(
    ...[symbols]: Parameters<SymbolRepository['add']>
  ): ReturnType<SymbolRepository['add']> {
    return pipe(
      te.tryCatch(
        () => model.insertMany(symbols),
        createErrorFromUnknown(AddSymbolsError, 'ADD_SYMBOLS_ERROR'),
      ),
      te.map(constVoid),
    );
  };
}

function buildGetAll(model: SymbolModel): SymbolRepository['getAll'] {
  return pipe(
    te.tryCatch(() => model.find(), createErrorFromUnknown(GetAllSymbolsError, 'GET_ALL_SYMBOLS_ERROR')),
    te.map((list) => list.map((doc) => omit(['_id', '__v'], doc.toJSON({ virtuals: true })))),
  );
}
