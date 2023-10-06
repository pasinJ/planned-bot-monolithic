import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { BtExecutionId } from '#features/btStrategies/dataModels/btExecution.js';
import { SymbolName } from '#features/shared/symbol.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { createHttpError, isHttpError } from '#infra/http/client.error.js';
import { createFileServiceError, isFileServiceError } from '#infra/services/file/error.js';
import { DayString, MonthString, YearString } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';

import {
  DownloadDailyKlinesZipFileDeps,
  DownloadMonthlyKlinesZipFileDeps,
  downloadDailyKlinesZipFile,
  downloadMonthlyKlinesZipFile,
} from './downloadKlinesZipFile.js';

const baseUrl = 'https://binance.com';
const downloadOutputPath = './output';
const httpError = createHttpError('ServerSideError', 'Mock', new Error());
const extractFailedError = createFileServiceError('ExtractFileFailed', 'Mock');

describe('UUT: Download monthly klines zip file', () => {
  function mockDeps(
    overrides?: DeepPartial<DownloadMonthlyKlinesZipFileDeps>,
  ): DownloadMonthlyKlinesZipFileDeps {
    return mergeDeepRight(
      {
        httpClient: { downloadFile: jest.fn().mockReturnValue(te.right(undefined)) },
        fileService: { extractZipFile: jest.fn().mockReturnValue(te.right(undefined)) },
        bnbService: {
          getConfig: () => ({ PUBLIC_DATA_BASE_URL: baseUrl, DOWNLOAD_OUTPUT_PATH: downloadOutputPath }),
        },
      },
      overrides ?? {},
    ) as DownloadMonthlyKlinesZipFileDeps;
  }

  const defaultMonthlyRequest = {
    executionId: 'w_8YAInWtv' as BtExecutionId,
    symbol: 'ADAUSDT' as SymbolName,
    timeframe: timeframeEnum['1M'],
    year: '2022' as YearString,
    month: '06' as MonthString,
  };

  describe('[WHEN] download klines monthly file', () => {
    const bnbConfig = { PUBLIC_DATA_BASE_URL: baseUrl, DOWNLOAD_OUTPUT_PATH: downloadOutputPath };
    const request = {
      executionId: 'w_8YAInWtv' as BtExecutionId,
      symbol: 'ADAUSDT' as SymbolName,
      timeframe: timeframeEnum['1M'],
      year: '2022' as YearString,
      month: '06' as MonthString,
    };

    it('[THEN] it will send a download request with correct options', async () => {
      const deps = mockDeps({ bnbService: { getConfig: () => bnbConfig } });

      await executeT(downloadMonthlyKlinesZipFile(deps, request));

      expect(deps.httpClient.downloadFile).toHaveBeenCalledExactlyOnceWith({
        method: 'GET',
        url: `${baseUrl}/data/spot/monthly/klines/ADAUSDT/1mo/ADAUSDT-1mo-2022-06.zip`,
        outputPath: `${downloadOutputPath}/${request.executionId}/ADAUSDT-1mo-2022-06.zip`,
      });
    });
    it('[THEN] it will extract the downloaded zip file', async () => {
      const deps = mockDeps({ bnbService: { getConfig: () => bnbConfig } });

      await executeT(downloadMonthlyKlinesZipFile(deps, request));

      expect(deps.fileService.extractZipFile).toHaveBeenCalledExactlyOnceWith(
        `${downloadOutputPath}/${request.executionId}/ADAUSDT-1mo-2022-06.zip`,
        `${downloadOutputPath}/${request.executionId}/ADAUSDT-1mo-2022-06.csv`,
      );
    });
    it('[THEN] it will return Right of CSV file path', async () => {
      const deps = mockDeps({ bnbService: { getConfig: () => bnbConfig } });

      const result = await executeT(downloadMonthlyKlinesZipFile(deps, request));

      expect(result).toEqualRight(`${downloadOutputPath}/${request.executionId}/ADAUSDT-1mo-2022-06.csv`);
    });
  });
  describe('[GIVEN] HTTP client returns error', () => {
    describe('[WHEN] download klines monthly file', () => {
      it('[THEN] it will return Left of error', async () => {
        const deps = mockDeps({ httpClient: { downloadFile: () => te.left(httpError) } });
        const request = defaultMonthlyRequest;

        const result = await executeT(downloadMonthlyKlinesZipFile(deps, request));

        expect(result).toEqualLeft(expect.toSatisfy(isHttpError));
      });
    });
  });
  describe('[GIVEN] extracting zip file fails', () => {
    describe('[WHEN] download klines monthly file', () => {
      it('[THEN] it will return Left of error', async () => {
        const deps = mockDeps({ fileService: { extractZipFile: () => te.left(extractFailedError) } });
        const request = defaultMonthlyRequest;

        const result = await executeT(downloadMonthlyKlinesZipFile(deps, request));

        expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
      });
    });
  });
});

describe('UUT: Download daily klines zip file', () => {
  function mockDeps(overrides?: DeepPartial<DownloadDailyKlinesZipFileDeps>): DownloadDailyKlinesZipFileDeps {
    return mergeDeepRight(
      {
        httpClient: { downloadFile: jest.fn().mockReturnValue(te.right(undefined)) },
        fileService: { extractZipFile: jest.fn().mockReturnValue(te.right(undefined)) },
        bnbService: {
          getConfig: () => ({ PUBLIC_DATA_BASE_URL: baseUrl, DOWNLOAD_OUTPUT_PATH: downloadOutputPath }),
        },
      },
      overrides ?? {},
    ) as DownloadDailyKlinesZipFileDeps;
  }

  const defaultDailyRequest = {
    executionId: 'w_8YAInWtv' as BtExecutionId,
    symbol: 'ADAUSDT' as SymbolName,
    timeframe: timeframeEnum['1M'],
    year: '2022' as YearString,
    month: '06' as MonthString,
    day: '01' as DayString,
  };

  describe('[WHEN] download klines daily file', () => {
    const bnbConfig = { PUBLIC_DATA_BASE_URL: baseUrl, DOWNLOAD_OUTPUT_PATH: downloadOutputPath };
    const request = {
      executionId: 'w_8YAInWtv' as BtExecutionId,
      symbol: 'ADAUSDT' as SymbolName,
      timeframe: timeframeEnum['1M'],
      year: '2022' as YearString,
      month: '06' as MonthString,
      day: '01' as DayString,
    };

    it('[THEN] it will download file with correct options', async () => {
      const deps = mockDeps({ bnbService: { getConfig: () => bnbConfig } });

      await executeT(downloadDailyKlinesZipFile(deps, request));

      expect(deps.httpClient.downloadFile).toHaveBeenCalledExactlyOnceWith({
        method: 'GET',
        url: `${baseUrl}/data/spot/daily/klines/ADAUSDT/1mo/ADAUSDT-1mo-2022-06-01.zip`,
        outputPath: `${downloadOutputPath}/${request.executionId}/ADAUSDT-1mo-2022-06-01.zip`,
      });
    });
    it('[THEN] it will extract the downloaded zip file', async () => {
      const deps = mockDeps({ bnbService: { getConfig: () => bnbConfig } });

      await executeT(downloadDailyKlinesZipFile(deps, request));

      expect(deps.fileService.extractZipFile).toHaveBeenCalledExactlyOnceWith(
        `${downloadOutputPath}/${request.executionId}/ADAUSDT-1mo-2022-06-01.zip`,
        `${downloadOutputPath}/${request.executionId}/ADAUSDT-1mo-2022-06-01.csv`,
      );
    });
    it('[THEN] it will return Right of CSV file path', async () => {
      const deps = mockDeps({ bnbService: { getConfig: () => bnbConfig } });

      const result = await executeT(downloadDailyKlinesZipFile(deps, request));

      expect(result).toEqualRight(`${downloadOutputPath}/${request.executionId}/ADAUSDT-1mo-2022-06-01.csv`);
    });
  });
  describe('[GIVEN] HTTP client returns error', () => {
    describe('[WHEN] download klines daily file', () => {
      it('[THEN] it will return Left of error', async () => {
        const deps = mockDeps({ httpClient: { downloadFile: () => te.left(httpError) } });
        const request = defaultDailyRequest;

        const result = await executeT(downloadDailyKlinesZipFile(deps, request));

        expect(result).toEqualLeft(expect.toSatisfy(isHttpError));
      });
    });
  });
  describe('[GIVEN] extracting zip file fails', () => {
    describe('[WHEN] download klines daily file', () => {
      it('[THEN] it will return Left of error', async () => {
        const deps = mockDeps({ fileService: { extractZipFile: () => te.left(extractFailedError) } });
        const request = defaultDailyRequest;

        const result = await executeT(downloadDailyKlinesZipFile(deps, request));

        expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
      });
    });
  });
});
