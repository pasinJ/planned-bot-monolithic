import { eachDayOfInterval, format } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, concat, isNil } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { BtExecutionId } from '#features/btStrategies/dataModels/btExecution.js';
import { exchangeNameEnum } from '#features/shared/exchange.js';
import { Kline } from '#features/shared/kline.js';
import { SymbolName } from '#features/shared/symbol.js';
import { Timeframe } from '#features/shared/timeframe.js';
import { HttpError } from '#infra/http/client.error.js';
import { HttpClient } from '#infra/http/client.type.js';
import { BnbServiceError, createBnbServiceError } from '#infra/services/binance/error.js';
import { FileServiceError } from '#infra/services/file/error.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { DateRange, DayString, MonthString, YearString } from '#shared/utils/date.js';

import { ExtractZipFile } from '../file/extractZipFile.js';
import { ReadCsvFile } from '../file/readCsvFile.js';
import { downloadDailyKlinesZipFile } from './downloadKlinesZipFile.js';
import { GetKlinesByApi } from './getKlinesByApi.js';
import { transformCsvRowToKline } from './transformCsvRowToKline.js';

export type GetKlinesByDailyFiles = (
  request: GetKlinesByDailyFilesRequest,
) => te.TaskEither<GetKlinesByDailyFilesError, readonly Kline[]>;
export type GetKlinesByDailyFilesDeps = DeepReadonly<{
  httpClient: Pick<HttpClient, 'downloadFile'>;
  fileService: { extractZipFile: ExtractZipFile; readCsvFile: ReadCsvFile };
  bnbService: {
    getConfig: io.IO<{ PUBLIC_DATA_BASE_URL: string; DOWNLOAD_OUTPUT_PATH: string }>;
    getKlinesByApi: GetKlinesByApi;
  };
}>;
export type GetKlinesByDailyFilesRequest = Readonly<{
  executionId: BtExecutionId;
  symbol: SymbolName;
  timeframe: Timeframe;
  dateRange: DateRange;
}>;
export type GetKlinesByDailyFilesError = BnbServiceError<'GetKlinesByDailyFilesFailed'>;

export function getKlinesByDailyFiles(deps: GetKlinesByDailyFilesDeps): GetKlinesByDailyFiles {
  return (request) => {
    const { fileService, bnbService } = deps;
    const { dateRange, ...rest } = request;
    const { symbol, timeframe } = request;

    return pipe(
      t.of(getListOfDays(dateRange)),
      t.chain((listOfDays) =>
        pipe(
          listOfDays.map(({ year, month, day }) =>
            downloadDailyKlinesZipFile(deps, { year, month, day, ...rest }),
          ),
          t.sequenceArray,
          t.map((results) => separateCsvFilePathAndFallbackList(listOfDays, results)),
        ),
      ),
      te.bindW('fallbackKlines', ({ fallback }) => {
        const fallbackDateRange = createFallbackDateRange(fallback, dateRange);

        return isNil(fallbackDateRange)
          ? te.right([])
          : bnbService.getKlinesByApi({ symbol, timeframe, dateRange: fallbackDateRange });
      }),
      te.bindW('csvKlines', ({ csvFilePath }) =>
        pipe(
          te.sequenceArray(csvFilePath.map(fileService.readCsvFile)),
          te.chainEitherKW((files) =>
            e.sequenceArray(
              files.flatMap((rows) =>
                rows.flatMap(
                  transformCsvRowToKline({ exchange: exchangeNameEnum.BINANCE, symbol, timeframe }),
                ),
              ),
            ),
          ),
        ),
      ),
      te.map(({ fallbackKlines, csvKlines }) => concat(csvKlines, fallbackKlines)),
      te.mapLeft((error) =>
        createBnbServiceError('GetKlinesByDailyFilesFailed', 'Getting klines by daily files failed', error),
      ),
    );
  };
}

export function getListOfDays(
  range: DateRange,
): readonly Readonly<{ year: YearString; month: MonthString; day: DayString }>[] {
  return eachDayOfInterval(range).map((date) => ({
    year: date.getUTCFullYear().toString() as YearString,
    month: format(date, 'MM') as MonthString,
    day: format(date, 'dd') as DayString,
  }));
}

function separateCsvFilePathAndFallbackList(
  listOfDays: readonly Readonly<{ year: YearString; month: MonthString; day: DayString }>[],
  results: readonly e.Either<
    HttpError | GeneralError<'WriteFileFailed'> | FileServiceError<'ExtractZipFileFailed'>,
    string
  >[],
): e.Either<
  | HttpError
  | GeneralError<'WriteFileFailed'>
  | FileServiceError<'ExtractZipFileFailed'>
  | GeneralError<'FileMissing'>,
  {
    fallback: readonly Readonly<{ year: YearString; month: MonthString; day: DayString }>[];
    csvFilePath: readonly string[];
  }
> {
  let fileHasBegunToExist = false;
  let notFoundAlreadyHappened = false;

  return results.reduce(
    (
      prev: e.Either<
        | HttpError
        | GeneralError<'WriteFileFailed'>
        | FileServiceError<'ExtractZipFileFailed'>
        | GeneralError<'FileMissing'>,
        { fallback: { year: YearString; month: MonthString; day: DayString }[]; csvFilePath: string[] }
      >,
      current,
      index,
      arr,
    ) => {
      if (e.isLeft(prev)) return prev;

      const { fallback, csvFilePath } = prev.right;
      const downloadSucceeded = e.isRight(current);
      const downloadFailedWithNotFound = e.isLeft(current) && current.left.type === 'NotFound';
      const downloadFailedWithOthers = e.isLeft(current) && current.left.type !== 'NotFound';
      const isLastTwo = index >= arr.length - 2;

      if (downloadSucceeded) fileHasBegunToExist = true;

      if (downloadSucceeded && !notFoundAlreadyHappened) {
        return e.right({ fallback, csvFilePath: append(current.right, csvFilePath) });
      } else if (
        (downloadSucceeded && notFoundAlreadyHappened) ||
        (downloadFailedWithNotFound && fileHasBegunToExist && !isLastTwo)
      ) {
        return e.left(
          createGeneralError('FileMissing', 'Something is wrong, files should not be missing in the middle'),
        );
      } else if (downloadFailedWithNotFound && fileHasBegunToExist && isLastTwo) {
        notFoundAlreadyHappened = true;
        return e.right({ csvFilePath, fallback: append(listOfDays[index], fallback) });
      } else if (downloadFailedWithOthers) {
        return current;
      } else {
        return prev;
      }
    },
    e.right({ fallback: [], csvFilePath: [] }),
  );
}

function createFallbackDateRange(
  fallback: readonly Readonly<{ year: YearString; month: MonthString; day: DayString }>[],
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
