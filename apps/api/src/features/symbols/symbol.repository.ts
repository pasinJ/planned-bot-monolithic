import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';
import { omit } from 'ramda';

import { createErrorFromUnknown } from '#shared/error.js';

import { SymbolModel, createSymbolModel } from './symbol.model.js';
import {
  AddSymbolsError,
  CountAllSymbolsError,
  CreateSymbolRepoError,
  GetAllSymbolsError,
  SymbolRepo,
} from './symbol.repository.type.js';

export function createSymbolRepo(client: Mongoose): ioe.IOEither<CreateSymbolRepoError, SymbolRepo> {
  return pipe(
    createSymbolModel(client),
    ioe.map((model) => ({
      add: addSymbols(model),
      getAll: getAll(model),
      countAll: countAll(model),
    })),
  );
}

function addSymbols(model: SymbolModel): SymbolRepo['add'] {
  return (symbols) =>
    pipe(
      te.tryCatch(() => model.insertMany(symbols), createErrorFromUnknown(AddSymbolsError)),
      te.as(symbols),
    );
}

function getAll(model: SymbolModel): SymbolRepo['getAll'] {
  return pipe(
    te.tryCatch(() => model.find(), createErrorFromUnknown(GetAllSymbolsError)),
    te.map((list) => list.map((doc) => omit(['_id', '__v'], doc.toJSON({ virtuals: true })))),
  );
}

function countAll(model: SymbolModel): SymbolRepo['countAll'] {
  return te.tryCatch(() => model.count(), createErrorFromUnknown(CountAllSymbolsError));
}
