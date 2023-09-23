import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { includes, isNotNil, omit, pathOr } from 'ramda';

import { ExchangeName } from '#features/shared/domain/exchange.js';
import { createErrorFromUnknown } from '#shared/errors/appError.js';

import { SymbolModel } from '../dataModels/symbol.js';
import { SymbolDaoError, createSymbolDaoError } from './symbol.error.js';
import { SymbolMongooseModel } from './symbol.js';

export function addSymbolModels({ mongooseModel }: { mongooseModel: SymbolMongooseModel }) {
  return (symbols: SymbolModel | readonly SymbolModel[]): te.TaskEither<SymbolDaoError<'AddFailed'>, void> =>
    pipe(
      te.tryCatch(
        () => mongooseModel.insertMany(symbols, { ordered: false }),
        createErrorFromUnknown(createSymbolDaoError('AddFailed', 'Adding new symbol(s) failed')),
      ),
      te.orElse((error) =>
        pipe(pathOr('', ['cause', 'message'], error), includes('duplicate key error'))
          ? te.right(undefined)
          : te.left(error),
      ),
      te.asUnit,
    );
}

export function getAllSymbolModels({
  mongooseModel,
}: {
  mongooseModel: SymbolMongooseModel;
}): te.TaskEither<SymbolDaoError<'GetAllFailed'>, readonly SymbolModel[]> {
  return pipe(
    te.tryCatch(
      () => mongooseModel.find().lean(),
      createErrorFromUnknown(createSymbolDaoError('GetAllFailed', 'Getting all symbols failed')),
    ),
    te.map((list) => list.map((doc) => omit(['_id', '__v'], doc))),
  );
}

export function existSymbolModelByExchange({ mongooseModel }: { mongooseModel: SymbolMongooseModel }) {
  return (exchange: ExchangeName): te.TaskEither<SymbolDaoError<'ExistByExchangeFailed'>, boolean> =>
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

export function getSymbolModelByNameAndExchange({ mongooseModel }: { mongooseModel: SymbolMongooseModel }) {
  return (
    name: string,
    exchange: ExchangeName,
  ): te.TaskEither<SymbolDaoError<'GetByNameAndExchangeFailed' | 'NotExist'>, SymbolModel> =>
    pipe(
      te.tryCatch(
        () => mongooseModel.findOne({ name, exchange }).lean(),
        createErrorFromUnknown(
          createSymbolDaoError(
            'GetByNameAndExchangeFailed',
            `Getting symbol model with name ${name} and exchange ${exchange} failed`,
          ),
        ),
      ),
      te.chainW(
        te.fromPredicate(isNotNil, () =>
          createSymbolDaoError(
            'NotExist',
            `Symbol model with name ${name} and exchange ${exchange} does not exist`,
          ),
        ),
      ),
      te.map((doc) => omit(['_id', '__v'], doc)),
    );
}
