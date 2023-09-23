import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { DeepReadonly } from 'ts-essentials';

import { ExchangeName } from '#features/shared/domain/exchange.js';
import { Language } from '#features/shared/domain/strategy.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { SymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { AssetName, SymbolModel } from '#features/symbols/dataModels/symbol.js';
import { DateService } from '#infra/services/date/service.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';

import { BtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BtStrategyId, BtStrategyModel, createBtStrategyModel } from '../dataModels/btStrategy.js';

export type AddBtStrategyDeps = DeepReadonly<{
  dateService: DateService;
  symbolDao: {
    getByNameAndExchange: (
      name: string,
      exchange: ExchangeName,
    ) => te.TaskEither<SymbolDaoError<'GetByNameAndExchangeFailed' | 'NotExist'>, SymbolModel>;
  };
  btStrategyDao: {
    generateId: io.IO<BtStrategyId>;
    add: (btStrategy: BtStrategyModel) => te.TaskEither<BtStrategyDaoError<'AddFailed'>, void>;
  };
}>;
export type AddBtStrategyRequest = Readonly<{
  name: string;
  exchange: ExchangeName;
  symbol: string;
  currency: string;
  timeframe: Timeframe;
  maxNumKlines: number;
  initialCapital: number;
  takerFeeRate: number;
  makerFeeRate: number;
  startTimestamp: ValidDate;
  endTimestamp: ValidDate;
  language: Language;
  body: string;
}>;

export function addBtStrategy(
  dep: AddBtStrategyDeps,
  request: AddBtStrategyRequest,
): te.TaskEither<
  | SymbolDaoError<'GetByNameAndExchangeFailed' | 'NotExist'>
  | GeneralError<'InvalidCurrency' | 'CreateBtStrategyModelError'>
  | BtStrategyDaoError<'AddFailed'>,
  Readonly<{ id: BtStrategyId; createdAt: ValidDate }>
> {
  const { dateService, btStrategyDao, symbolDao } = dep;

  return pipe(
    symbolDao.getByNameAndExchange(request.symbol, request.exchange),
    te.bindW('symbol', (symbol) => {
      return request.currency === symbol.baseAsset || request.currency === symbol.quoteAsset
        ? te.right({ name: symbol.name, currency: request.currency as AssetName })
        : te.left(
            createGeneralError(
              'InvalidCurrency',
              `Currency of strategy must be either base asset (${symbol.baseAsset}) or quote asset (${symbol.quoteAsset}) of symbol`,
            ),
          );
    }),
    te.let('id', () => btStrategyDao.generateId()),
    te.let('currentDate', () => dateService.getCurrentDate()),
    te.bindW('btStrategy', ({ symbol: { name, currency }, id, currentDate }) =>
      te.fromEither(createBtStrategyModel({ ...request, id, symbol: name, currency }, currentDate)),
    ),
    te.chainFirstW(({ btStrategy }) => btStrategyDao.add(btStrategy)),
    te.map(({ btStrategy }) => ({ id: btStrategy.id, createdAt: btStrategy.createdAt })),
  );
}
