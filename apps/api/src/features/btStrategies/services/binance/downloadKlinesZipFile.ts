import io from 'fp-ts/lib/IO.js';
import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { SymbolName } from '#features/shared/symbol.js';
import { Timeframe } from '#features/shared/timeframe.js';
import { HttpError } from '#infra/http/client.error.js';
import { HttpClient } from '#infra/http/client.type.js';
import { FileServiceError } from '#infra/services/file/error.js';
import { GeneralError } from '#shared/errors/generalError.js';
import { DayString, MonthString, YearString } from '#shared/utils/date.js';

import { BtExecutionId } from '../../dataModels/btExecution.js';
import { ExtractZipFile } from '../file/extractZipFile.js';

export type CsvFilePath = string & z.BRAND<'CsvFilePath'>;

export type DownloadMonthlyKlinesZipFileDeps = DeepReadonly<{
  httpClient: Pick<HttpClient, 'downloadFile'>;
  fileService: { extractZipFile: ExtractZipFile };
  bnbService: { getConfig: io.IO<{ PUBLIC_DATA_BASE_URL: string; DOWNLOAD_OUTPUT_PATH: string }> };
}>;
export type DownloadMonthlyKlinesZipFileRequest = Readonly<{
  executionId: BtExecutionId;
  symbol: SymbolName;
  timeframe: Timeframe;
  year: YearString;
  month: MonthString;
}>;
export function downloadMonthlyKlinesZipFile(
  deps: DownloadMonthlyKlinesZipFileDeps,
  request: DownloadMonthlyKlinesZipFileRequest,
): te.TaskEither<
  HttpError | GeneralError<'WriteFileFailed'> | FileServiceError<'ExtractZipFileFailed'>,
  CsvFilePath
> {
  const { httpClient, fileService, bnbService } = deps;

  return pipe(
    bnbService.getConfig,
    io.map(({ PUBLIC_DATA_BASE_URL, DOWNLOAD_OUTPUT_PATH }) => {
      const { executionId, symbol, timeframe, year, month } = request;
      const { url, zipFileName } = formMonthlyFileUrl(PUBLIC_DATA_BASE_URL, symbol, timeframe, year, month);
      const { zipFilePath, csvFilePath } = formZipAndCsvFilePaths(
        DOWNLOAD_OUTPUT_PATH,
        executionId,
        zipFileName,
      );

      return { url, zipFilePath, csvFilePath };
    }),
    te.fromIO,
    te.chainFirstW(({ url, zipFilePath }) =>
      httpClient.downloadFile({ method: 'GET', url, outputPath: zipFilePath }),
    ),
    te.chainFirstW(({ zipFilePath, csvFilePath }) => fileService.extractZipFile(zipFilePath, csvFilePath)),
    te.map(({ csvFilePath }) => csvFilePath),
  );
}

function formMonthlyFileUrl(
  baseUrl: string,
  symbol: SymbolName,
  timeframe: Timeframe,
  year: YearString,
  month: MonthString,
): Readonly<{ url: string; zipFileName: string }> {
  const basePath = '/data/spot/monthly/klines/<symbol_in_uppercase>/<interval>/'
    .replace('<symbol_in_uppercase>', symbol.toUpperCase())
    .replace('<interval>', timeframe === '1M' ? '1mo' : timeframe);
  const zipFileName = '<symbol_in_uppercase>-<interval>-<year>-<month>.zip'
    .replace('<symbol_in_uppercase>', symbol.toUpperCase())
    .replace('<interval>', timeframe === '1M' ? '1mo' : timeframe)
    .replace('<year>', year)
    .replace('<month>', month);

  return { url: baseUrl + basePath + zipFileName, zipFileName };
}

export type DownloadDailyKlinesZipFileDeps = DeepReadonly<{
  httpClient: Pick<HttpClient, 'downloadFile'>;
  fileService: { extractZipFile: ExtractZipFile };
  bnbService: { getConfig: io.IO<{ PUBLIC_DATA_BASE_URL: string; DOWNLOAD_OUTPUT_PATH: string }> };
}>;
export type DownloadDailyKlinesZipFileRequest = Readonly<{
  executionId: BtExecutionId;
  symbol: SymbolName;
  timeframe: Timeframe;
  year: YearString;
  month: MonthString;
  day: DayString;
}>;
export function downloadDailyKlinesZipFile(
  deps: DownloadDailyKlinesZipFileDeps,
  request: DownloadDailyKlinesZipFileRequest,
): te.TaskEither<
  HttpError | GeneralError<'WriteFileFailed'> | FileServiceError<'ExtractZipFileFailed'>,
  CsvFilePath
> {
  const { httpClient, fileService, bnbService } = deps;

  return pipe(
    bnbService.getConfig,
    io.map(({ PUBLIC_DATA_BASE_URL, DOWNLOAD_OUTPUT_PATH }) => {
      const { executionId, symbol, timeframe, year, month, day } = request;
      const { url, zipFileName } = formDailyFileUrl(
        PUBLIC_DATA_BASE_URL,
        symbol,
        timeframe,
        year,
        month,
        day,
      );
      const { zipFilePath, csvFilePath } = formZipAndCsvFilePaths(
        DOWNLOAD_OUTPUT_PATH,
        executionId,
        zipFileName,
      );

      return { url, zipFilePath, csvFilePath };
    }),
    te.fromIO,
    te.chainFirstW(({ url, zipFilePath }) =>
      httpClient.downloadFile({ method: 'GET', url, outputPath: zipFilePath }),
    ),
    te.chainFirstW(({ zipFilePath, csvFilePath }) => fileService.extractZipFile(zipFilePath, csvFilePath)),
    te.map(({ csvFilePath }) => csvFilePath),
  );
}

function formDailyFileUrl(
  baseUrl: string,
  symbol: SymbolName,
  timeframe: Timeframe,
  year: YearString,
  month: MonthString,
  day: DayString,
): Readonly<{ url: string; zipFileName: string }> {
  const basePath = '/data/spot/daily/klines/<symbol_in_uppercase>/<interval>/'
    .replace('<symbol_in_uppercase>', symbol.toUpperCase())
    .replace('<interval>', timeframe === '1M' ? '1mo' : timeframe);
  const zipFileName = '<symbol_in_uppercase>-<interval>-<year>-<month>-<day>.zip'
    .replace('<symbol_in_uppercase>', symbol.toUpperCase())
    .replace('<interval>', timeframe === '1M' ? '1mo' : timeframe)
    .replace('<year>', year)
    .replace('<month>', month)
    .replace('<day>', day);

  return { url: baseUrl + basePath + zipFileName, zipFileName };
}

function formZipAndCsvFilePaths(
  baseOutputPath: string,
  executionId: BtExecutionId,
  zipFileName: string,
): {
  zipFilePath: string;
  csvFilePath: CsvFilePath;
} {
  const zipFilePath = `${baseOutputPath}/${executionId}/${zipFileName}`;
  const csvFilePath = zipFilePath.replace('.zip', '.csv') as CsvFilePath;

  return { zipFilePath, csvFilePath };
}
