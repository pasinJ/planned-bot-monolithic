import { eachMonthOfInterval, format } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import t from 'fp-ts/lib/Task.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { append, concat, includes, isNil } from 'ramda';
import { DeepReadonly } from 'ts-essentials';

import { exchangeNameEnum } from '#features/shared/domain/exchange.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { SymbolName } from '#features/symbols/dataModels/symbol.js';
import { HttpError } from '#infra/http/client.error.js';
import { HttpClient } from '#infra/http/client.type.js';
import { BnbServiceError, createBnbServiceError } from '#infra/services/binance/error.js';
import { FileServiceError } from '#infra/services/file/error.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';
import { DateRange, MonthString, YearString } from '#shared/utils/date.js';

import { BtExecutionId } from '../dataModels/btExecution.js';
import { KlineModel } from '../dataModels/kline.js';
import { downloadKlinesZipFile } from './downloadKlinesZipFile.js';
import { transformKlineCsvToKlineModel } from './transformKlineCsvToKlineModel.js';

export type GetKlinesFromMonthlyFilesDeps = DeepReadonly<{
  httpClient: Pick<HttpClient, 'downloadFile'>;
  fileService: {
    extractZipFile: (
      zipFilePath: string,
      outputFilePath: string,
    ) => te.TaskEither<FileServiceError<'ExtractFileFailed'>, void>;
    readCsvFile: (filePath: string) => te.TaskEither<FileServiceError<'ReadCsvFileFailed'>, string[][]>;
  };
  bnbService: {
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
}>;
export type GetKlinesFromMonthlyFilesRequest = Readonly<{
  executionId: BtExecutionId;
  symbol: SymbolName;
  timeframe: Timeframe;
  dateRange: DateRange;
}>;

export function getKlinesFromMonthlyFiles(deps: GetKlinesFromMonthlyFilesDeps) {
  return (
    request: GetKlinesFromMonthlyFilesRequest,
  ): te.TaskEither<BnbServiceError<'GetKlinesFromMonthlyFilesFailed'>, readonly KlineModel[]> => {
    const { fileService, bnbService } = deps;
    const { dateRange, ...rest } = request;
    const { symbol, timeframe } = request;

    return pipe(
      t.of(getListOfMonths(dateRange)),
      t.chain((listOfMonths) =>
        pipe(
          listOfMonths.map(({ year, month }) => downloadKlinesZipFile(deps, { year, month, ...rest })),
          t.sequenceArray,
          t.map((results) => getFallbackList(listOfMonths, results)),
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
          BnbServiceError<'GetKlinesFromMonthlyFilesFailed' | 'GetKlinesFromApiFailed'>,
          readonly KlineModel[]
        >;
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
          'GetKlinesFromMonthlyFilesFailed',
          'Getting klines from monthly files failed',
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

function getFallbackList(
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
  let fileBeginToExist = false;

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
        return e.right({ csvFilePath, fallback: append(listOfMonths[index], fallback) });
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
