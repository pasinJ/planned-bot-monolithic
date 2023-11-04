import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { omit } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { ExchangeName } from '#SECT/Exchange.js';
import { Timeframe } from '#SECT/Kline.js';
import { ValidDate } from '#SECT/date.js';
import { Language } from '#features/shared/strategy.js';
import {
  GetSymbolByNameAndExchange,
  GetSymbolByNameAndExchangeError,
} from '#features/symbols/DAOs/symbol.feature.js';
import { DateService } from '#infra/services/date/service.js';
import { GeneralError } from '#shared/errors/generalError.js';
import { TimezoneString } from '#shared/utils/string.js';

import { UpdateBtStrategyById, UpdateBtStrategyByIdErr } from '../DAOs/btStrategy.feature.js';
import {
  BtStrategyId,
  createBtStrategyModel,
  validateBtStrategyCurrencies,
} from '../dataModels/btStrategy.js';

export type UpdateBtStrategyUseCaseDeps = DeepReadonly<{
  dateService: DateService;
  symbolDao: { getByNameAndExchange: GetSymbolByNameAndExchange };
  btStrategyDao: { updateById: UpdateBtStrategyById };
}>;
export type UpdateBtStrategyUseCaseReq = DeepReadonly<{
  id: string;
  name: string;
  exchange: ExchangeName;
  symbol: string;
  assetCurrency: string;
  capitalCurrency: string;
  timeframe: Timeframe;
  maxNumKlines: number;
  initialCapital: number;
  takerFeeRate: number;
  makerFeeRate: number;
  btRange: { start: ValidDate; end: ValidDate };
  timezone: TimezoneString;
  language: Language;
  body: string;
}>;
export type UpdateBtStrategyUseCaseErr =
  | GetSymbolByNameAndExchangeError
  | GeneralError<'InvalidCurrency' | 'CreateBtStrategyModelError'>
  | UpdateBtStrategyByIdErr;
export type UpdateBtStrategyResp = Readonly<{ updatedAt: ValidDate }>;

export default function updateBtStrategyUseCase(
  deps: UpdateBtStrategyUseCaseDeps,
  req: UpdateBtStrategyUseCaseReq,
): te.TaskEither<UpdateBtStrategyUseCaseErr, UpdateBtStrategyResp> {
  const { dateService, symbolDao, btStrategyDao } = deps;
  const { symbol, exchange, assetCurrency, capitalCurrency } = req;
  const { id, btRange, ...restReq } = req;

  return pipe(
    te.Do,
    te.bindW('symbol', () => symbolDao.getByNameAndExchange(symbol, exchange)),
    te.bindW('currencies', ({ symbol }) =>
      te.fromEither(validateBtStrategyCurrencies(symbol, assetCurrency, capitalCurrency)),
    ),
    te.bindW('currentDate', () => te.fromIO(dateService.getCurrentDate)),
    te.chainFirstW(({ symbol, currencies, currentDate }) =>
      pipe(
        createBtStrategyModel(
          {
            ...restReq,
            ...currencies,
            id: id as BtStrategyId,
            symbol: symbol.name,
            startTimestamp: btRange.start,
            endTimestamp: btRange.end,
          },
          currentDate,
        ),
        te.fromEither,
        te.chainFirstW(({ id, ...rest }) =>
          btStrategyDao.updateById(id, omit(['version', 'createdAt', 'updatedAt'], rest)),
        ),
      ),
    ),
    te.map(({ currentDate }) => ({ updatedAt: currentDate })),
  );
}
