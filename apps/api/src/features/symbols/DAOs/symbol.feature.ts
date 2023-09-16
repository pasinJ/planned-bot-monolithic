import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { isNotNil, omit } from 'ramda';

import { ExchangeName } from '#features/shared/domain/exchangeName.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { SymbolModel } from '../data-models/symbol.js';
import { SymbolDaoError, createSymbolDaoError } from './symbol.error.js';
import { SymbolMongooseModel } from './symbol.js';

export function addSymbolModels({ mongooseModel }: { mongooseModel: SymbolMongooseModel }) {
  return (symbols: SymbolModel | readonly SymbolModel[]): te.TaskEither<SymbolDaoError<'AddFailed'>, void> =>
    pipe(
      te.tryCatch(
        () => mongooseModel.insertMany(symbols),
        createErrorFromUnknown(createSymbolDaoError('AddFailed', 'Adding new symbol(s) failed')),
      ),
      te.asUnit,
    );
}

export function getAllSymbolModels({ mongooseModel }: { mongooseModel: SymbolMongooseModel }) {
  return pipe(
    te.tryCatch(
      () => mongooseModel.find(),
      createErrorFromUnknown(createSymbolDaoError('GetAllFailed', 'Getting all symbols failed')),
    ),
    te.map((list) => list.map((doc) => omit(['_id', '__v'], doc.toJSON()))),
  );
}

export function existSymbolModelByExchange({ mongooseModel }: { mongooseModel: SymbolMongooseModel }) {
  return (exchange: ExchangeName) =>
    pipe(
      te.tryCatch(
        () => mongooseModel.exists({ exchange }),
        createErrorFromUnknown(
          createSymbolDaoError(
            'ExistByExchangeFailed',
            `Checking existence for symbols of exchange ${exchange} failed`,
          ),
        ),
      ),
      te.map(isNotNil),
    );
}

export function existSymbolModelByNameAndExchange({ mongooseModel }: { mongooseModel: SymbolMongooseModel }) {
  return (name: string, exchange: ExchangeName) =>
    pipe(
      te.tryCatch(
        () => mongooseModel.exists({ name, exchange }),
        createErrorFromUnknown(
          createSymbolDaoError(
            'ExistByNameAndExchangeFailed',
            `Checking existence for symbols of name ${name} and exchange ${exchange} failed`,
          ),
        ),
      ),
      te.map(isNotNil),
    );
}
