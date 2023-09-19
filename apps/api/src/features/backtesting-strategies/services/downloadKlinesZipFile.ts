import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';

import { SymbolName } from '#features/shared/domain/symbolName.js';
import { Timeframe } from '#features/shared/domain/timeframe.js';
import { HttpError } from '#infra/http/client.error.js';
import { HttpClient } from '#infra/http/client.type.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { FileServiceError } from '#infra/services/file/error.js';
import { GeneralError } from '#shared/errors/generalError.js';

import { BtExecutionId } from '../data-models/btExecution.js';
import { Day, Month, Year } from './getKlinesForBt.js';

export type DownloadKlinesZipFileDeps = {
  httpClient: Pick<HttpClient, 'downloadFile'>;
  fileService: {
    extractZipFile: (
      zipFilePath: string,
      outputFilePath: string,
    ) => te.TaskEither<FileServiceError<'ExtractFileFailed'>, void>;
  };
};
export type DownloadKlinesZipFileRequest = {
  executionId: BtExecutionId;
  symbol: SymbolName;
  timeframe: Timeframe;
  year: Year;
  month: Month;
  day?: Day;
};

export function downloadKlinesZipFile(
  deps: DownloadKlinesZipFileDeps,
  request: DownloadKlinesZipFileRequest,
): te.TaskEither<
  HttpError | GeneralError<'WriteFileFailed'> | FileServiceError<'ExtractFileFailed'>,
  string
> {
  const { httpClient, fileService } = deps;
  const { executionId, symbol, timeframe, year, month, day } = request;
  const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();

  const { url, fileName: zipFileName } = day
    ? formDailyFileUrl(symbol, timeframe, year, month, day)
    : formMonthlyFileUrl(symbol, timeframe, year, month);

  const zipFilePath = `${DOWNLOAD_OUTPUT_PATH}/${executionId}/${zipFileName}`;
  const csvFilePath = zipFilePath.replace('.zip', '.csv');

  return pipe(
    httpClient.downloadFile({ method: 'GET', url, outputPath: zipFilePath }),
    te.chainW(() => fileService.extractZipFile(zipFilePath, csvFilePath)),
    te.map(() => csvFilePath),
  );
}

function formMonthlyFileUrl(
  symbol: SymbolName,
  timeframe: Timeframe,
  year: Year,
  month: Month,
): { url: string; fileName: string } {
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
  year: Year,
  month: Month,
  day: Day,
): { url: string; fileName: string } {
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
