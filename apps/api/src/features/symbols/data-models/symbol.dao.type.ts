import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';

import { ExchangeName } from '#features/exchanges/domain/exchange.js';

import { SymbolId, SymbolModel } from './symbol-model/index.js';
import { SymbolModelDaoError } from './symbol.dao.error.js';

export type SymbolModelDao = {
  generateId: io.IO<SymbolId>;
  add: <S extends SymbolModel | readonly SymbolModel[]>(
    symbols: S,
  ) => te.TaskEither<SymbolModelDaoError<'AddFailed'>, void>;
  getAll: te.TaskEither<SymbolModelDaoError<'GetAllFailed'>, readonly SymbolModel[]>;
  existByExchange: (
    exchange: ExchangeName,
  ) => te.TaskEither<SymbolModelDaoError<'ExistByExchangeFailed'>, boolean>;
};
