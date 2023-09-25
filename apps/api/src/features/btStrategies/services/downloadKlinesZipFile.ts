import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { DeepReadonly } from 'ts-essentials';
import { z } from 'zod';

import { Timeframe } from '#features/shared/domain/timeframe.js';
import { SymbolName } from '#features/symbols/dataModels/symbol.js';
import { HttpError } from '#infra/http/client.error.js';
import { HttpClient } from '#infra/http/client.type.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { FileServiceError } from '#infra/services/file/error.js';
import { GeneralError } from '#shared/errors/generalError.js';
import { DayString, MonthString, YearString } from '#shared/utils/date.js';

import { BtExecutionId } from '../dataModels/btExecution.js';

export type DownloadKlinesZipFileDeps = DeepReadonly<{
  httpClient: Pick<HttpClient, 'downloadFile'>;
  fileService: {
    extractZipFile: (
      zipFilePath: string,
      outputFilePath: string,
    ) => te.TaskEither<FileServiceError<'ExtractFileFailed'>, void>;
  };
}>;
export type DownloadKlinesZipFileRequest = Readonly<{
  executionId: BtExecutionId;
  symbol: SymbolName;
  timeframe: Timeframe;
  year: YearString;
  month: MonthString;
  day?: DayString;
}>;

export type CsvFilePath = string & z.BRAND<'CsvFilePath'>;

export function downloadKlinesZipFile(
  deps: DownloadKlinesZipFileDeps,
  request: DownloadKlinesZipFileRequest,
): te.TaskEither<
  HttpError | GeneralError<'WriteFileFailed'> | FileServiceError<'ExtractFileFailed'>,
  CsvFilePath
> {
  const { httpClient, fileService } = deps;
  const { executionId, symbol, timeframe, year, month, day } = request;
  const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();

  const { url, fileName: zipFileName } = day
    ? formDailyFileUrl(symbol, timeframe, year, month, day)
    : formMonthlyFileUrl(symbol, timeframe, year, month);

  const zipFilePath = `${DOWNLOAD_OUTPUT_PATH}/${executionId}/${zipFileName}`;
  const csvFilePath = zipFilePath.replace('.zip', '.csv') as CsvFilePath;

  return pipe(
    httpClient.downloadFile({ method: 'GET', url, outputPath: zipFilePath }),
    te.chainW(() => fileService.extractZipFile(zipFilePath, csvFilePath)),
    te.map(() => csvFilePath),
  );
}

function formMonthlyFileUrl(
  symbol: SymbolName,
  timeframe: Timeframe,
  year: YearString,
  month: MonthString,
): Readonly<{ url: string; fileName: string }> {
  const baseUrl = getBnbConfig().PUBLIC_DATA_BASE_URL;
  const basePath = '/data/spot/monthly/klines/<symbol_in_uppercase>/<interval>/'
    .replace('<symbol_in_uppercase>', symbol.toUpperCase())
    .replace('<interval>', timeframe === '1M' ? '1mo' : timeframe);
  const fileName = '<symbol_in_uppercase>-<interval>-<year>-<month>.zip'
    .replace('<symbol_in_uppercase>', symbol.toUpperCase())
    .replace('<interval>', timeframe === '1M' ? '1mo' : timeframe)
    .replace('<year>', year)
    .replace('<month>', month);

  return { url: baseUrl + basePath + fileName, fileName };
}

function formDailyFileUrl(
  symbol: SymbolName,
  timeframe: Timeframe,
  year: YearString,
  month: MonthString,
  day: DayString,
): Readonly<{ url: string; fileName: string }> {
  const baseUrl = getBnbConfig().PUBLIC_DATA_BASE_URL;
  const basePath = '/data/spot/daily/klines/<symbol_in_uppercase>/<interval>'
    .replace('<symbol_in_uppercase>', symbol.toUpperCase())
    .replace('<interval>', timeframe === '1M' ? '1mo' : timeframe);
  const fileName = '<symbol_in_uppercase>-<interval>-<year>-<month>-<day>.zip'
    .replace('<symbol_in_uppercase>', symbol.toUpperCase())
    .replace('<interval>', timeframe === '1M' ? '1mo' : timeframe)
    .replace('<year>', year)
    .replace('<month>', month)
    .replace('<day>', day);

  return { url: baseUrl + basePath + fileName, fileName };
}
