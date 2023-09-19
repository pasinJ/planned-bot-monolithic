import { eachDayOfInterval, format } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, concat, isNil } from 'ramda';

import { exchangeNameEnum } from '#features/shared/domain/exchangeName.js';
import { SymbolName } from '#features/shared/domain/symbolName.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { HttpError } from '#infra/http/client.error.js';
import { HttpClient } from '#infra/http/client.type.js';
import { BnbServiceError, createBnbServiceError } from '#infra/services/binance/error.js';
import { FileServiceError } from '#infra/services/file/error.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';

import { BtExecutionId } from '../data-models/btExecution.js';
import { KlineModel } from '../data-models/kline.js';
import { downloadKlinesZipFile } from './downloadKlinesZipFile.js';
import { DateRange, Day, Month, Year } from './getKlinesForBt.js';
import { transformKlineCsvToKlineModel } from './transformKlineCsvToKlineModel.js';

export type GetKlinesFromDailyFilesDeps = {
  httpClient: Pick<HttpClient, 'downloadFile'>;
  fileService: {
    extractZipFile: (
      zipFilePath: string,
      outputFilePath: string,
    ) => te.TaskEither<FileServiceError<'ExtractFileFailed'>, void>;
    readCsvFile: (filePath: string) => te.TaskEither<FileServiceError<'ReadCsvFileFailed'>, string[][]>;
  };
  bnbService: {
    getKlinesFromApi: (request: {
      symbol: SymbolName;
      timeframe: Timeframe;
      dateRange: DateRange;
    }) => te.TaskEither<BnbServiceError<'GetKlinesFromApiFailed'>, readonly KlineModel[]>;
  };
};
export type GetKlinesFromDailyFilesRequest = {
  executionId: BtExecutionId;
  symbol: SymbolName;
  timeframe: Timeframe;
  dateRange: DateRange;
};

export function getKlinesFromDailyFiles(deps: GetKlinesFromDailyFilesDeps) {
  return (
    request: GetKlinesFromDailyFilesRequest,
  ): te.TaskEither<BnbServiceError<'GetKlinesFromDailyFilesFailed'>, readonly KlineModel[]> => {
    const { fileService, bnbService } = deps;
    const { dateRange, ...rest } = request;
    const { symbol, timeframe } = request;

    return pipe(
      t.of(getListOfDays(dateRange)),
      t.chain((listOfDays) =>
        pipe(
          listOfDays.map(({ year, month, day }) =>
            downloadKlinesZipFile(deps, { year, month, day, ...rest }),
          ),
          t.sequenceArray,
          t.map((results) => getFallbackList(listOfDays, results)),
        ),
      ),
      te.bindW('fallbackKlines', ({ fallback }) => {
        const fallbackDateRange = createFallbackDateRange(fallback, dateRange);

        return isNil(fallbackDateRange)
          ? te.right([])
          : bnbService.getKlinesFromApi({ symbol, timeframe, dateRange: fallbackDateRange });
      }),
      te.bindW('csvKlines', ({ csvFilePath }) =>
        pipe(
          te.sequenceArray(csvFilePath.map(fileService.readCsvFile)),
          te.chainEitherKW((files) =>
            e.sequenceArray(
              files.flatMap((rows) =>
                rows.flatMap(
                  transformKlineCsvToKlineModel({ exchange: exchangeNameEnum.BINANCE, symbol, timeframe }),
                ),
              ),
            ),
          ),
        ),
      ),
      te.map(({ fallbackKlines, csvKlines }) => concat(csvKlines, fallbackKlines)),
      te.mapLeft((error) =>
        createBnbServiceError(
          'GetKlinesFromDailyFilesFailed',
          'Getting klines from daily files failed',
          error,
        ),
      ),
    );
  };
}

export function getListOfDays(range: DateRange): { year: Year; month: Month; day: Day }[] {
  return eachDayOfInterval(range).map((date) => ({
    year: date.getUTCFullYear().toString() as Year,
    month: format(date, 'MM') as Month,
    day: format(date, 'dd') as Day,
  }));
}

function getFallbackList(
  listOfDays: { year: Year; month: Month; day: Day }[],
  results: readonly e.Either<
    HttpError | GeneralError<'WriteFileFailed'> | FileServiceError<'ExtractFileFailed'>,
    string
  >[],
): e.Either<
  | HttpError
  | GeneralError<'WriteFileFailed'>
  | FileServiceError<'ExtractFileFailed'>
  | GeneralError<'FileMissing'>,
  { fallback: { year: Year; month: Month; day: Day }[]; csvFilePath: string[] }
> {
  let fileBeginToExist = false;

  return results.reduce(
    (
      prev: e.Either<
        | HttpError
        | GeneralError<'WriteFileFailed'>
        | FileServiceError<'ExtractFileFailed'>
        | GeneralError<'FileMissing'>,
        { fallback: { year: Year; month: Month; day: Day }[]; csvFilePath: string[] }
      >,
      current,
      index,
      arr,
    ) => {
      if (e.isLeft(prev)) return prev;

      const { fallback, csvFilePath } = prev.right;

      if (e.isRight(current)) {
        fileBeginToExist = true;
        return e.right({ fallback, csvFilePath: append(current.right, csvFilePath) });
      } else if (e.isLeft(current) && current.left.type !== 'NotFound') {
        return current;
      } else if (
        e.isLeft(current) &&
        current.left.type === 'NotFound' &&
        fileBeginToExist &&
        index >= arr.length - 2
      ) {
        return e.right({ csvFilePath, fallback: append(listOfDays[index], fallback) });
      } else if (e.isLeft(current) && current.left.type === 'NotFound' && fileBeginToExist) {
        return e.left(
          createGeneralError('FileMissing', 'Something is wrong, files should not be missing in the middle'),
        );
      } else {
        return prev;
      }
    },
    e.right({ fallback: [], csvFilePath: [] }),
  );
}

function createFallbackDateRange(
  fallback: { year: Year; month: Month; day: Day }[],
  orgDateRange: DateRange,
): DateRange | null {
  if (fallback.length === 0) return null;
  else {
    return {
      start: new Date(`${fallback[0].year}-${fallback[0].month}-${fallback[0].day}`),
      end: orgDateRange.end,
    } as DateRange;
  }
}
