import ioe from 'fp-ts/lib/IOEither.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { Mongoose } from 'mongoose';
import { nanoid } from 'nanoid';
import { omit } from 'ramda';

import { createErrorFromUnknown } from '#shared/errors/externalError.js';

import { SymbolId } from '../domain/symbol.entity.js';
import { SymbolRepoError, createSymbolRepoError } from './symbol.error.js';
import { SymbolModel, createSymbolModel } from './symbol.model.js';
import { SymbolRepo } from './symbol.type.js';

export function createSymbolRepo(
  client: Mongoose,
): ioe.IOEither<SymbolRepoError<'CreateSymbolRepoError'>, SymbolRepo> {
  return pipe(
    createSymbolModel(client),
    ioe.map((model) => ({
      generateId: () => nanoid() as SymbolId,
      add: addSymbols(model),
      getAll: getAll(model),
      countAll: countAll(model),
    })),
  );
}

function addSymbols(model: SymbolModel): SymbolRepo['add'] {
  return (symbols) =>
    pipe(
      te.tryCatch(
        () => model.insertMany(symbols),
        createErrorFromUnknown(
          createSymbolRepoError('AddSymbolError', 'Adding new symbol(s) to MongoDb failed'),
        ),
      ),
      te.as(symbols),
    );
}

function getAll(model: SymbolModel): SymbolRepo['getAll'] {
  return pipe(
    te.tryCatch(
      () => model.find(),
      createErrorFromUnknown(
        createSymbolRepoError('GetAllSymbolsError', 'Getting all symbols from MongoDb failed'),
      ),
    ),
    te.map((list) => list.map((doc) => omit(['_id', '__v'], doc.toJSON({ virtuals: true })))),
  );
}

function countAll(model: SymbolModel): SymbolRepo['countAll'] {
  return te.tryCatch(
    () => model.count(),
    createErrorFromUnknown(
      createSymbolRepoError('CountAllSymbolsError', 'Counting all symbols in MongoDb failed'),
    ),
  );
}
