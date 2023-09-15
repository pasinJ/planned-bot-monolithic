import { eachDayOfInterval, eachMonthOfInterval, format, isAfter, isBefore } from 'date-fns';
import e from 'fp-ts/lib/Either.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { createReadStream, createWriteStream } from 'fs';
import { writeFile } from 'fs/promises';
import unzipper from 'unzipper';
import { z } from 'zod';

import { SymbolName } from '#features/symbols/data-models/symbol-model/index.js';
import { HttpError } from '#infra/http/client.error.js';
import { HttpClient } from '#infra/http/client.type.js';
import { BnbServiceError, createBnbServiceError } from '#infra/services/binance/error.js';
import { Timeframe } from '#shared/domain/timeframe.js';
import { createErrorFromUnknown } from '#shared/errors/externalError.js';
import { GeneralError, createGeneralError } from '#shared/errors/generalError.js';

import { KlineModel } from '../data-models/kline.model.js';

export type BnbService = {
  getKlinesHistory: (request: {
    symbol: SymbolName;
    timeframe: Timeframe;
    start: Date;
    end: Date;
  }) => te.TaskEither<BnbServiceError, readonly KlineModel[]>;
};

// export type GetKlinesHistoryDeps = { httpClient: HttpClient; dateService: DateService };
// export function getKlinesHistory(deps: GetKlinesHistoryDeps): BnbService['getKlinesHistory'] {
//   const { dateService } = deps;

//   return ({ symbol, timeframe, start, end }) =>
//     pipe(
//       te.fromIO(dateService.getCurrentDate),
//       te.chainEitherK((currentDate) => validateTimestamp(currentDate, start, end)),
//       te.map(getListOfMonths),
//     );
// }

type StartTimestamp = Date & z.BRAND<'StartTimestamp'>;
type EndTimestamp = Date & z.BRAND<'EndTimestamp'>;
export type DateRange = { start: StartTimestamp; end: EndTimestamp };
export function validateTimestamp(
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

export type Year = string & z.BRAND<'Year'>;
export type Month = string & z.BRAND<'Month'>;
export type Day = string & z.BRAND<'Day'>;
export function getListOfMonths(range: DateRange): { year: Year; month: Month }[] {
  return eachMonthOfInterval(range).map((date) => ({
    year: date.getUTCFullYear().toString() as Year,
    month: format(date, 'MM') as Month,
  }));
}

export function getListOfDays(range: DateRange): { year: Year; month: Month; day: Day }[] {
  return eachDayOfInterval(range).map((date) => ({
    year: date.getUTCFullYear().toString() as Year,
    month: format(date, 'MM') as Month,
    day: format(date, 'dd') as Day,
  }));
}

type MonthlyKlineRequest = { symbol: SymbolName; timeframe: Timeframe; year: Year; month: Month };
export function downloadMonthlyKlinesZipFile(
  deps: { httpClient: HttpClient },
  request: MonthlyKlineRequest,
): te.TaskEither<
  GeneralError<'DownloadFileFailed' | 'WriteFileFailed' | 'ExtractFileFailed'>,
  MonthlyKlineRequest | { zipFilePath: string; csvFilePath: string }
> {
  const { httpClient } = deps;
  const { symbol, timeframe, year, month } = request;
  const basePath = '/data/spot/monthly/klines/<symbol_in_uppercase>/<interval>'
    .replace('<symbol_in_uppercase>', symbol.toUpperCase())
    .replace('<interval>', timeframe === '1M' ? '1mo' : timeframe);
  const zipFileName = '<symbol_in_uppercase>-<interval>-<year>-<month>.zip'
    .replace('<symbol_in_uppercase>', symbol.toUpperCase())
    .replace('<interval>', timeframe === '1M' ? '1mo' : timeframe)
    .replace('<year>', year)
    .replace('<month>', month);
  const zipFilePath = './downloads/' + zipFileName;
  const csvFilePath = zipFilePath.replace('.zip', '.csv');

  return pipe(
    httpClient.sendRequest({ method: 'GET', url: basePath + '/' + zipFileName, responseSchema: z.any() }),
    te.mapLeft(separateFileNotFoundErrorForRetry(zipFileName)),
    te.chainW(writeZipFile(zipFilePath)),
    te.chainW(() => extractZipFile(zipFilePath, csvFilePath)),
    te.map(() => ({ zipFilePath, csvFilePath })),
    te.orElseW(swapFileNotFoundErrorToRight(request)),
  );
}

function separateFileNotFoundErrorForRetry(
  fileName: string,
): (error: HttpError) => GeneralError<'DownloadFileFailed' | 'FileNotFound'> {
  return (error) =>
    (error.type === 'NotFound'
      ? createGeneralError({ type: 'FileNotFound', message: `File ${fileName} not found` })
      : createGeneralError({
          type: 'DownloadFileFailed',
          message: `Downloading file ${fileName} failed`,
          cause: error,
        })) as GeneralError<'DownloadFileFailed' | 'FileNotFound'>;
}

function writeZipFile(
  zipFilePath: string,
): (data: Buffer) => te.TaskEither<GeneralError<'WriteFileFailed'>, void> {
  return (data) =>
    te.tryCatch(
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      () => writeFile(zipFilePath, data),
      createErrorFromUnknown(createGeneralError({ type: 'WriteFileFailed', message: '' })),
    );
}

function extractZipFile(
  zipFilePath: string,
  outputFilePath: string,
): te.TaskEither<GeneralError<'ExtractFileFailed'>, void> {
  return te.tryCatch(
    () =>
      new Promise(
        (resolve, reject) =>
          /* eslint-disable security/detect-non-literal-fs-filename */
          createReadStream(zipFilePath)
            .pipe(unzipper.ParseOne())
            .pipe(createWriteStream(outputFilePath))
            .on('finish', () => resolve(undefined))
            .on('error', (error) => reject(error)),
        /* eslint-enable security/detect-non-literal-fs-filename */
      ),
    createErrorFromUnknown(createGeneralError({ type: 'ExtractFileFailed', message: '' })),
  );
}

function swapFileNotFoundErrorToRight(
  request: MonthlyKlineRequest,
): (
  error: GeneralError<'DownloadFileFailed' | 'WriteFileFailed' | 'ExtractFileFailed' | 'FileNotFound'>,
) => te.TaskEither<
  GeneralError<'DownloadFileFailed' | 'WriteFileFailed' | 'ExtractFileFailed'>,
  MonthlyKlineRequest
> {
  return (error) =>
    (error.type === 'FileNotFound' ? te.right(request) : te.left(error)) as te.TaskEither<
      GeneralError<'DownloadFileFailed' | 'WriteFileFailed' | 'ExtractFileFailed'>,
      MonthlyKlineRequest
    >;
}
