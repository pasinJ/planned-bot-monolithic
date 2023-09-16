import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { equals } from 'ramda';

import { ExchangeName } from '#features/shared/domain/exchangeName.js';
import { SymbolName } from '#features/shared/domain/symbolName.js';
import { SymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { DateService } from '#infra/services/date/service.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';

import { BtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BtStrategyId, BtStrategyModel, createBtStrategyModel } from '../data-models/btStrategy.js';

export type AddBtStrategyDeps = {
  dateService: DateService;
  symbolDao: {
    existByNameAndExchange: (
      name: string,
      exchange: ExchangeName,
    ) => te.TaskEither<SymbolDaoError<'ExistByNameAndExchangeFailed'>, boolean>;
  };
  btStrategyDao: {
    generateId: io.IO<BtStrategyId>;
    add: (btStrategy: BtStrategyModel) => te.TaskEither<BtStrategyDaoError<'AddFailed'>, void>;
  };
};
export type AddBtStrategyRequest = {
  name: string;
  exchange: ExchangeName;
  symbol: string;
  currency: string;
  timeframe: string;
  maxNumKlines: number;
  initialCapital: number;
  takerFeeRate: number;
  makerFeeRate: number;
  startTimestamp: Date;
  endTimestamp: Date;
  language: string;
  body: string;
};

export function addBtStrategy(
  dep: AddBtStrategyDeps,
  request: AddBtStrategyRequest,
): te.TaskEither<
  | SymbolDaoError<'ExistByNameAndExchangeFailed'>
  | GeneralError<'SymbolNotExist' | 'CreateBtStrategyModelError'>
  | BtStrategyDaoError<'AddFailed'>,
  { id: BtStrategyId; createdAt: Date }
> {
  const { dateService, btStrategyDao, symbolDao } = dep;

  return pipe(
    symbolDao.existByNameAndExchange(request.symbol, request.exchange),
    te.chainW(
      te.fromPredicate(equals(true), () =>
        createGeneralError(
          'SymbolNotExist',
          `Symbol ${request.symbol} of exchnage ${request.exchange} doesn't exist`,
        ),
      ),
    ),
    te.let('symbol', () => request.symbol as SymbolName),
    te.let('id', () => btStrategyDao.generateId()),
    te.let('currentDate', () => dateService.getCurrentDate()),
    te.bindW('btStrategy', ({ symbol, id, currentDate }) =>
      te.fromEither(createBtStrategyModel({ ...request, id, symbol }, currentDate)),
    ),
    te.chainFirstW(({ btStrategy }) => btStrategyDao.add(btStrategy)),
    te.map(({ btStrategy }) => ({ id: btStrategy.id, createdAt: btStrategy.createdAt })),
  );
}
