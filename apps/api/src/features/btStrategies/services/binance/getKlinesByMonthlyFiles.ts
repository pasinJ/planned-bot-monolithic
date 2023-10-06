import { eachMonthOfInterval, format } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import io from 'fp-ts/lib/IO.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, concat, includes, isNil } from 'ramda';
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
import { DateRange, MonthString, YearString } from '#shared/utils/date.js';

import { downloadMonthlyKlinesZipFile } from './downloadKlinesZipFile.js';
import { transformCsvRowToKline } from './transformCsvRowToKline.js';

export type GetKlinesByMonthlyFilesDeps = DeepReadonly<{
  httpClient: Pick<HttpClient, 'downloadFile'>;
  fileService: {
    extractZipFile: (
      zipFilePath: string,
      outputFilePath: string,
    ) => te.TaskEither<FileServiceError<'ExtractFileFailed'>, void>;
    readCsvFile: (filePath: string) => te.TaskEither<FileServiceError<'ReadCsvFileFailed'>, string[][]>;
  };
  bnbService: {
    getConfig: io.IO<{ PUBLIC_DATA_BASE_URL: string; DOWNLOAD_OUTPUT_PATH: string }>;
    getKlinesFromDailyFiles: (request: {
      executionId: BtExecutionId;
      symbol: SymbolName;
      timeframe: Timeframe;
      dateRange: DateRange;
    }) => te.TaskEither<BnbServiceError<'GetKlinesFromDailyFilesFailed'>, readonly Kline[]>;
    getKlinesFromApi: (request: {
      symbol: SymbolName;
      timeframe: Timeframe;
      dateRange: DateRange;
    }) => te.TaskEither<BnbServiceError<'GetKlinesFromApiFailed'>, readonly Kline[]>;
  };
}>;
export type GetKlinesByMonthlyFilesRequest = Readonly<{
  executionId: BtExecutionId;
  symbol: SymbolName;
  timeframe: Timeframe;
  dateRange: DateRange;
}>;

export function getKlinesByMonthlyFiles(deps: GetKlinesByMonthlyFilesDeps) {
  return (
    request: GetKlinesByMonthlyFilesRequest,
  ): te.TaskEither<BnbServiceError<'GetKlinesByMonthlyFilesFailed'>, readonly Kline[]> => {
    const { fileService, bnbService } = deps;
    const { dateRange, ...rest } = request;
    const { symbol, timeframe } = request;

    return pipe(
      t.of(getListOfMonths(dateRange)),
      t.chain((listOfMonths) =>
        pipe(
          listOfMonths.map(({ year, month }) => downloadMonthlyKlinesZipFile(deps, { year, month, ...rest })),
          t.sequenceArray,
          t.map((results) => separateCsvFilePathAndFallbackList(listOfMonths, results)),
        ),
      ),
      te.bindW('fallbackKlines', ({ fallback }) => {
        const fallbackDateRange = createFallbackDateRange(fallback, dateRange);

        return (
          isNil(fallbackDateRange)
            ? te.right([])
            : includes(request.timeframe, ['1s', '1m', '3m'])
            ? bnbService.getKlinesFromDailyFiles({ dateRange: fallbackDateRange, ...rest })
            : bnbService.getKlinesFromApi({ symbol, timeframe, dateRange: fallbackDateRange })
        ) as te.TaskEither<
          BnbServiceError<'GetKlinesByMonthlyFilesFailed' | 'GetKlinesFromApiFailed'>,
          readonly Kline[]
        >;
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
        createBnbServiceError(
          'GetKlinesByMonthlyFilesFailed',
          'Getting klines by monthly files failed',
          error,
        ),
      ),
    );
  };
}

export function getListOfMonths(
  dateRange: DateRange,
): readonly Readonly<{ year: YearString; month: MonthString }>[] {
  return eachMonthOfInterval(dateRange).map((date) => ({
    year: date.getUTCFullYear().toString() as YearString,
    month: format(date, 'MM') as MonthString,
  }));
}

function separateCsvFilePathAndFallbackList(
  listOfMonths: readonly Readonly<{ year: YearString; month: MonthString }>[],
  results: readonly e.Either<
    HttpError | GeneralError<'WriteFileFailed'> | FileServiceError<'ExtractFileFailed'>,
    string
  >[],
): e.Either<
  | HttpError
  | GeneralError<'WriteFileFailed'>
  | FileServiceError<'ExtractFileFailed'>
  | GeneralError<'FileMissing'>,
  { fallback: readonly Readonly<{ year: YearString; month: MonthString }>[]; csvFilePath: readonly string[] }
> {
  let fileHasBegunToExist = false;
  let notFoundAlreadyHappened = false;

  return results.reduce(
    (
      prev: e.Either<
        | HttpError
        | GeneralError<'WriteFileFailed'>
        | FileServiceError<'ExtractFileFailed'>
        | GeneralError<'FileMissing'>,
        { fallback: { year: YearString; month: MonthString }[]; csvFilePath: string[] }
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
        return e.right({ csvFilePath, fallback: append(listOfMonths[index], fallback) });
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
  fallback: readonly Readonly<{ year: YearString; month: MonthString }>[],
  orgDateRange: DateRange,
): DateRange | null {
  if (fallback.length === 0) return null;
  else {
    return {
      start: new Date(`${fallback[0].year}-${fallback[0].month}`),
      end: orgDateRange.end,
    } as DateRange;
  }
}
