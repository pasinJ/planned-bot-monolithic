import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { DeepReadonly } from 'ts-essentials';

import { ExchangeName } from '#features/shared/exchange.js';
import { Language } from '#features/shared/strategy.js';
import { AssetName, Symbol } from '#features/shared/symbol.js';
import { Timeframe } from '#features/shared/timeframe.js';
import { SymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { DateService } from '#infra/services/date/service.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';
import { TimezoneString } from '#shared/utils/string.js';

import { BtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BtStrategyId, BtStrategyModel, createBtStrategyModel } from '../dataModels/btStrategy.js';

export type AddBtStrategyDeps = DeepReadonly<{
  dateService: DateService;
  symbolDao: {
    getByNameAndExchange: (
      name: string,
      exchange: ExchangeName,
    ) => te.TaskEither<SymbolDaoError<'GetByNameAndExchangeFailed' | 'NotExist'>, Symbol>;
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
  capitalCurrency: string;
  timeframe: Timeframe;
  maxNumKlines: number;
  initialCapital: number;
  takerFeeRate: number;
  makerFeeRate: number;
  startTimestamp: ValidDate;
  endTimestamp: ValidDate;
  timezone: TimezoneString;
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
  const { symbol, exchange, capitalCurrency } = request;

  return pipe(
    symbolDao.getByNameAndExchange(symbol, exchange),
    te.bindW('symbol', (symbol) => {
      return capitalCurrency === symbol.baseAsset || capitalCurrency === symbol.quoteAsset
        ? te.right({ name: symbol.name, capitalCurrency: capitalCurrency as AssetName })
        : te.left(
            createGeneralError(
              'InvalidCurrency',
              `Currency of strategy must be either base asset (${symbol.baseAsset}) or quote asset (${symbol.quoteAsset}) of symbol`,
            ),
          );
    }),
    te.let('id', () => btStrategyDao.generateId()),
    te.let('currentDate', () => dateService.getCurrentDate()),
    te.bindW('btStrategy', ({ symbol: { name, capitalCurrency }, id, currentDate }) =>
      te.fromEither(createBtStrategyModel({ ...request, id, symbol: name, capitalCurrency }, currentDate)),
    ),
    te.chainFirstW(({ btStrategy }) => btStrategyDao.add(btStrategy)),
    te.map(({ btStrategy }) => ({ id: btStrategy.id, createdAt: btStrategy.createdAt })),
  );
}
