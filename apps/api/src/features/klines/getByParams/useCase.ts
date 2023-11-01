import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { ExchangeName } from '#SECT/Exchange.js';
import { Kline, Timeframe } from '#SECT/Kline.js';
import { SymbolName } from '#SECT/Symbol.js';
import { BtExecutionId } from '#features/btStrategies/dataModels/btExecution.js';
import {
  BtEndTimestamp,
  BtStartTimestamp,
  MaxNumKlines,
} from '#features/btStrategies/dataModels/btStrategy.js';
import {
  GetKlinesForBt,
  GetKlinesForBtError,
} from '#features/btStrategies/services/binance/getKlinesForBt.js';
import { calculateNumOfKlinesInDateRange } from '#features/shared/kline.js';
import { DateRange } from '#features/shared/objectValues/dateRange.js';
import {
  GetSymbolByNameAndExchange,
  GetSymbolByNameAndExchangeError,
} from '#features/symbols/DAOs/symbol.feature.js';
import { isAfterOrEqual, isBeforeOrEqual } from '#shared/utils/date.js';

import {
  AddKlines,
  CountKlines,
  CountKlinesError,
  GetKlines,
  GetKlinesError,
} from '../DAOs/kline.feature.js';

export type GetKlinesByParamsUseCaseDeps = {
  symbolDao: { getByNameAndExchange: GetSymbolByNameAndExchange };
  klineDao: { count: CountKlines; get: GetKlines; add: AddKlines };
  bnbService: { downloadKlines: GetKlinesForBt };
};
export type GetKlinesByParamsUseCaseReq = {
  exchange: ExchangeName;
  symbol: string;
  timeframe: Timeframe;
  dateRange: DateRange;
};
export type GetKlinesByParamsUseCaseError =
  | GetSymbolByNameAndExchangeError
  | CountKlinesError
  | GetKlinesError
  | GetKlinesForBtError;

export function getKlinesByParamsUseCase(
  deps: GetKlinesByParamsUseCaseDeps,
  request: GetKlinesByParamsUseCaseReq,
): te.TaskEither<GetKlinesByParamsUseCaseError, readonly Kline[]> {
  const { symbolDao, klineDao, bnbService } = deps;
  const { exchange, symbol, timeframe, dateRange } = request;
  const klinesInRangeFilter = { exchange, symbol, timeframe, start: dateRange.start, end: dateRange.end };
  const expectedKlinesInDateRange = calculateNumOfKlinesInDateRange(dateRange, timeframe);

  return pipe(
    symbolDao.getByNameAndExchange(symbol, exchange),
    te.map(() => symbol as SymbolName),
    te.chainW((symbol) =>
      pipe(
        klineDao.count(klinesInRangeFilter),
        te.chainW(
          (existingKlines): te.TaskEither<GetKlinesError | GetKlinesForBtError, readonly Kline[]> =>
            existingKlines >= expectedKlinesInDateRange
              ? klineDao.get(klinesInRangeFilter)
              : pipe(
                  bnbService.downloadKlines({
                    executionId: 'any' as BtExecutionId,
                    symbol,
                    timeframe,
                    maxKlinesNum: 0 as MaxNumKlines,
                    startTimestamp: dateRange.start as BtStartTimestamp,
                    endTimestamp: dateRange.end as BtEndTimestamp,
                  }),
                  te.chainFirstIOK((klines) => klineDao.add(klines)),
                  te.map((klines) =>
                    klines.filter(
                      (kline) =>
                        isAfterOrEqual(kline.closeTimestamp, dateRange.start) &&
                        isBeforeOrEqual(kline.closeTimestamp, dateRange.end),
                    ),
                  ),
                ),
        ),
      ),
    ),
  );
}
