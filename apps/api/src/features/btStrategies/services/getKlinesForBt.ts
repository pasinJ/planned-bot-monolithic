import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
  eachDayOfInterval,
  eachMonthOfInterval,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subSeconds,
  subWeeks,
} from 'date-fns';
import { Decimal } from 'decimal.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { DeepReadonly } from 'ts-essentials';

import { Timeframe } from '#features/shared/domain/timeframe.js';
import { SymbolName } from '#features/symbols/dataModels/symbol.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { BnbServiceError, createBnbServiceError } from '#infra/services/binance/error.js';
import { FileServiceError } from '#infra/services/file/error.js';
import { DateRange, ValidDate } from '#shared/utils/date.js';

import { BtExecutionId } from '../dataModels/btExecution.js';
import { BtEndTimestamp, BtStartTimestamp, MaxNumKlines } from '../dataModels/btStrategy.js';
import { KlineModel } from '../dataModels/kline.js';

export type GetKlinesForBtDeps = DeepReadonly<{
  bnbService: {
    getKlinesFromMonthlyFiles: (request: {
      executionId: BtExecutionId;
      symbol: SymbolName;
      timeframe: Timeframe;
      dateRange: DateRange;
    }) => te.TaskEither<BnbServiceError<'GetKlinesFromMonthlyFilesFailed'>, readonly KlineModel[]>;
    getKlinesFromDailyFiles: (request: {
      executionId: BtExecutionId;
      symbol: SymbolName;
      timeframe: Timeframe;
      dateRange: DateRange;
    }) => te.TaskEither<BnbServiceError<'GetKlinesFromDailyFilesFailed'>, readonly KlineModel[]>;
    getKlinesFromApi: (request: {
      symbol: SymbolName;
      timeframe: Timeframe;
      dateRange: DateRange;
    }) => te.TaskEither<BnbServiceError<'GetKlinesFromApiFailed'>, readonly KlineModel[]>;
  };
  fileService: {
    createDirectory: (dirPath: string) => te.TaskEither<FileServiceError<'CreateDirFailed'>, void>;
    removeDirectory: (dirPath: string) => te.TaskEither<FileServiceError<'RemoveDirFailed'>, void>;
  };
}>;
export type GetKlinesForBtRequest = Readonly<{
  executionId: BtExecutionId;
  symbol: SymbolName;
  timeframe: Timeframe;
  maxKlinesNum: MaxNumKlines;
  startTimestamp: BtStartTimestamp;
  endTimestamp: BtEndTimestamp;
}>;

export function getKlinesForBt(deps: GetKlinesForBtDeps) {
  return (request: GetKlinesForBtRequest) => {
    const { bnbService, fileService } = deps;
    const { executionId, symbol, timeframe, maxKlinesNum, startTimestamp, endTimestamp } = request;

    return pipe(
      te.Do,
      te.let('dateRange', () =>
        extendDateRangeToIncludeRequiredNumOfKlines(
          { start: startTimestamp as ValidDate, end: endTimestamp as ValidDate } as DateRange,
          timeframe,
          maxKlinesNum,
        ),
      ),
      te.chainW(({ dateRange }) =>
        chooseGetKlinesMethod(bnbService, fileService, { executionId, symbol, timeframe, dateRange }),
      ),
      te.mapLeft((error) =>
        createBnbServiceError('GetKlinesForBtFailed', 'Getting klines for backtesting failed', error),
      ),
    );
  };
}

export function extendDateRangeToIncludeRequiredNumOfKlines(
  dateRange: DateRange,
  timeframe: Timeframe,
  maxNumKlines: MaxNumKlines,
): DateRange {
  const options = {
    '1s': { subFn: subSeconds, multiplier: 1 },
    '1m': { subFn: subMinutes, multiplier: 1 },
    '3m': { subFn: subMinutes, multiplier: 3 },
    '5m': { subFn: subMinutes, multiplier: 5 },
    '15m': { subFn: subMinutes, multiplier: 15 },
    '30m': { subFn: subMinutes, multiplier: 30 },
    '1h': { subFn: subHours, multiplier: 1 },
    '2h': { subFn: subHours, multiplier: 3 },
    '4h': { subFn: subHours, multiplier: 4 },
    '6h': { subFn: subHours, multiplier: 6 },
    '8h': { subFn: subHours, multiplier: 8 },
    '12h': { subFn: subHours, multiplier: 12 },
    '1d': { subFn: subDays, multiplier: 1 },
    '3d': { subFn: subDays, multiplier: 3 },
    '1w': { subFn: subWeeks, multiplier: 1 },
    '1M': { subFn: subMonths, multiplier: 1 },
  };

  return {
    start: options[timeframe].subFn(dateRange.start, maxNumKlines * options[timeframe].multiplier),
    end: dateRange.end,
  } as DateRange;
}

function chooseGetKlinesMethod(
  bnbService: GetKlinesForBtDeps['bnbService'],
  fileService: GetKlinesForBtDeps['fileService'],
  request: Readonly<{
    executionId: BtExecutionId;
    symbol: SymbolName;
    timeframe: Timeframe;
    dateRange: DateRange;
  }>,
): te.TaskEither<
  | BnbServiceError<
      'GetKlinesFromApiFailed' | 'GetKlinesFromDailyFilesFailed' | 'GetKlinesFromMonthlyFilesFailed'
    >
  | FileServiceError<'CreateDirFailed'>,
  readonly KlineModel[]
> {
  const { executionId, symbol, timeframe, dateRange } = request;

  const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
  const downloadDirPath = `${DOWNLOAD_OUTPUT_PATH}/${executionId}`;

  const numOfApiCalls = approximateNumOfApiCalls(timeframe, dateRange);
  const numOfDailyFiles = calculateNumOfDailyFiles(dateRange);
  const numOfMothlyFiles = calculateNumOfMonthlyFiles(dateRange);

  function createTempDirAndRemoveAfterFinish<E, A>(getKlinesFn: te.TaskEither<E, A>) {
    return pipe(
      fileService.createDirectory(downloadDirPath),
      te.chainW(() =>
        pipe(
          getKlinesFn,
          t.chainFirstIOK(() => fileService.removeDirectory(downloadDirPath)),
        ),
      ),
    );
  }

  if (['1s', '1m'].includes(timeframe)) {
    if (numOfApiCalls <= 10 && numOfApiCalls <= numOfMothlyFiles * 5) {
      return bnbService.getKlinesFromApi({ symbol, timeframe, dateRange });
    } else if (numOfDailyFiles <= 10) {
      return createTempDirAndRemoveAfterFinish(
        bnbService.getKlinesFromDailyFiles({ executionId, symbol, timeframe, dateRange }),
      );
    } else {
      return createTempDirAndRemoveAfterFinish(
        bnbService.getKlinesFromMonthlyFiles({ executionId, symbol, timeframe, dateRange }),
      );
    }
  } else if (['3m', '5m', '15m', '30m', '1h', '2h', '4h'].includes(timeframe)) {
    if (numOfApiCalls <= 10 && numOfApiCalls <= numOfMothlyFiles * 5) {
      return bnbService.getKlinesFromApi({ symbol, timeframe, dateRange });
    } else {
      return createTempDirAndRemoveAfterFinish(
        bnbService.getKlinesFromMonthlyFiles({ executionId, symbol, timeframe, dateRange }),
      );
    }
  } else {
    return bnbService.getKlinesFromApi({ symbol, timeframe, dateRange });
  }
}

export function approximateNumOfApiCalls(timeframe: Timeframe, dateRange: DateRange) {
  function approximateNumOfKlinesInDateRange(range: DateRange, timeframe: Timeframe) {
    const options = {
      '1s': { diffFn: differenceInSeconds, step: 1 },
      '1m': { diffFn: differenceInMinutes, step: 1 },
      '3m': { diffFn: differenceInMinutes, step: 3 },
      '5m': { diffFn: differenceInMinutes, step: 5 },
      '15m': { diffFn: differenceInMinutes, step: 15 },
      '30m': { diffFn: differenceInMinutes, step: 30 },
      '1h': { diffFn: differenceInHours, step: 1 },
      '2h': { diffFn: differenceInHours, step: 3 },
      '4h': { diffFn: differenceInHours, step: 4 },
      '6h': { diffFn: differenceInHours, step: 6 },
      '8h': { diffFn: differenceInHours, step: 8 },
      '12h': { diffFn: differenceInHours, step: 12 },
      '1d': { diffFn: differenceInDays, step: 1 },
      '3d': { diffFn: differenceInDays, step: 3 },
      '1w': { diffFn: differenceInWeeks, step: 1 },
      '1M': { diffFn: differenceInMonths, step: 1 },
    };

    const diff = options[timeframe].diffFn(range.end, range.start);
    const step = options[timeframe].step;
    const num = new Decimal(diff).dividedBy(step).floor().toNumber();

    return num === 0 ? 1 : num;
  }

  return new Decimal(approximateNumOfKlinesInDateRange(dateRange, timeframe))
    .dividedBy(1000)
    .ceil()
    .toNumber();
}

export function calculateNumOfMonthlyFiles(dateRange: DateRange) {
  return eachMonthOfInterval(dateRange).length;
}

export function calculateNumOfDailyFiles(dateRange: DateRange) {
  return eachDayOfInterval(dateRange).length;
}
