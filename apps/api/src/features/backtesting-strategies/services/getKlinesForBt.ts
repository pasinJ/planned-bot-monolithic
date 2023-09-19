import {
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  differenceInMonths,
  differenceInSeconds,
  differenceInWeeks,
  eachDayOfInterval,
  eachMonthOfInterval,
  isAfter,
  isBefore,
  subDays,
  subHours,
  subMinutes,
  subMonths,
  subSeconds,
  subWeeks,
} from 'date-fns';
import { Decimal } from 'decimal.js';
import e from 'fp-ts/lib/Either.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { z } from 'zod';

import { SymbolName } from '#features/shared/domain/symbolName.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { BnbServiceError, createBnbServiceError } from '#infra/services/binance/error.js';
import { DateService } from '#infra/services/date/service.js';
import { FileServiceError } from '#infra/services/file/error.js';

import { BtExecutionId } from '../data-models/btExecution.js';
import { MaxNumKlines } from '../data-models/btStrategy.js';
import { KlineModel } from '../data-models/kline.js';

export type GetKlinesForBtDeps = {
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
  dateService: DateService;
};
export type GetKlinesForBtRequest = {
  executionId: BtExecutionId;
  symbol: SymbolName;
  timeframe: Timeframe;
  maxKlinesNum: MaxNumKlines;
  startTimestamp: Date;
  endTimestamp: Date;
};

export function getKlinesForBt(deps: GetKlinesForBtDeps) {
  return (request: GetKlinesForBtRequest) => {
    const { dateService, bnbService, fileService } = deps;
    const { executionId, symbol, timeframe, maxKlinesNum, startTimestamp, endTimestamp } = request;

    return pipe(
      te.Do,
      te.bindW('dateRange', () =>
        pipe(
          te.fromIO(dateService.getCurrentDate),
          te.chainEitherK((currentDate) => validateDateRange(currentDate, startTimestamp, endTimestamp)),
          te.map((dateRange) => extendDateRangeByMaxNumKlines(dateRange, timeframe, maxKlinesNum)),
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

type StartTimestamp = Date & z.BRAND<'StartTimestamp'>;
type EndTimestamp = Date & z.BRAND<'EndTimestamp'>;
export type DateRange = { start: StartTimestamp; end: EndTimestamp };

export type Year = string & z.BRAND<'Year'>;
export type Month = string & z.BRAND<'Month'>;
export type Day = string & z.BRAND<'Day'>;

export function validateDateRange(
  currentDate: Date,
  start: Date,
  end: Date,
): e.Either<BnbServiceError<'InvalidRequest'>, DateRange> {
  if (!isBefore(start, end)) {
    return e.left(createBnbServiceError('InvalidRequest', 'Start timestamp must be before end timestamp'));
  } else if (isAfter(start, currentDate)) {
    return e.left(createBnbServiceError('InvalidRequest', 'Start timestamp must not be in the future'));
  } else if (isAfter(end, currentDate)) {
    return e.left(createBnbServiceError('InvalidRequest', 'End timestamp must not be in the future'));
  } else {
    return e.right({ start: start, end: end } as DateRange);
  }
}

export function extendDateRangeByMaxNumKlines(
  range: DateRange,
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
    start: options[timeframe].subFn(range.start, maxNumKlines * options[timeframe].multiplier),
    end: range.end,
  } as DateRange;
}

function chooseGetKlinesMethod(
  bnbService: GetKlinesForBtDeps['bnbService'],
  fileService: GetKlinesForBtDeps['fileService'],
  request: {
    executionId: BtExecutionId;
    symbol: SymbolName;
    timeframe: Timeframe;
    dateRange: DateRange;
  },
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

  function createDownloadDirAndRemoveAfterFinish<E, A>(getKlinesFn: te.TaskEither<E, A>) {
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
      return createDownloadDirAndRemoveAfterFinish(
        bnbService.getKlinesFromDailyFiles({ executionId, symbol, timeframe, dateRange }),
      );
    } else {
      return createDownloadDirAndRemoveAfterFinish(
        bnbService.getKlinesFromMonthlyFiles({ executionId, symbol, timeframe, dateRange }),
      );
    }
  } else if (['3m', '5m', '15m', '30m', '1h', '2h', '4h'].includes(timeframe)) {
    if (numOfApiCalls <= 10 && numOfApiCalls <= numOfMothlyFiles * 5) {
      return bnbService.getKlinesFromApi({ symbol, timeframe, dateRange });
    } else {
      return createDownloadDirAndRemoveAfterFinish(
        bnbService.getKlinesFromMonthlyFiles({ executionId, symbol, timeframe, dateRange }),
      );
    }
  } else {
    return bnbService.getKlinesFromApi({ symbol, timeframe, dateRange });
  }
}

export type NumOfApiCalls = number & z.BRAND<'NumOfApiCall'>;
export function approximateNumOfApiCalls(timeframe: Timeframe, dateRange: DateRange): NumOfApiCalls {
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
    .toNumber() as NumOfApiCalls;
}

export type NumOfMonthlyFiles = number & z.BRAND<'NumOfMonthlyFile'>;
export function calculateNumOfMonthlyFiles(dateRange: DateRange): NumOfMonthlyFiles {
  return eachMonthOfInterval(dateRange).length as NumOfMonthlyFiles;
}

export type NumOfDailyFiles = number & z.BRAND<'NumOfDailyFile'>;
export function calculateNumOfDailyFiles(dateRange: DateRange): NumOfDailyFiles {
  return eachDayOfInterval(dateRange).length as NumOfDailyFiles;
}
