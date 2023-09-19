import { faker } from '@faker-js/faker';
import { format } from 'date-fns';
import te from 'fp-ts/lib/TaskEither.js';
import { allPass, includes, mergeDeepRight } from 'ramda';

import { createHttpError, isHttpError } from '#infra/http/client.error.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { createFileServiceError, isFileServiceError } from '#infra/services/file/error.js';
import { DeepPartial } from '#shared/helpers.type.js';
import { executeT } from '#shared/utils/fp.js';
import { randomTimeframe } from '#test-utils/domain.js';
import { randomAnyDate } from '#test-utils/faker.js';
import { randomExecutionId } from '#test-utils/features/btStrategies/models.js';
import { randomSymbolName } from '#test-utils/features/symbols/models.js';

import { DownloadKlinesZipFileDeps, downloadKlinesZipFile } from './downloadKlinesZipFile.js';
import { Day, Month, Year } from './getKlinesForBt.js';

describe('Download klines zip file', () => {
  function mockDeps(overrides?: DeepPartial<DownloadKlinesZipFileDeps>): DownloadKlinesZipFileDeps {
    return mergeDeepRight(
      {
        httpClient: { downloadFile: jest.fn().mockReturnValue(te.right(undefined)) },
        fileService: { extractZipFile: jest.fn().mockReturnValue(te.right(undefined)) },
      },
      overrides ?? {},
    ) as DownloadKlinesZipFileDeps;
  }
  function createMonthlyFileRequest() {
    const date = randomAnyDate();
    return {
      executionId: randomExecutionId(),
      symbol: randomSymbolName(),
      timeframe: randomTimeframe(),
      year: format(date, 'yyyy') as Year,
      month: format(date, 'MM') as Month,
    };
  }
  function createDailyFileRequest() {
    const date = randomAnyDate();
    return {
      executionId: randomExecutionId(),
      symbol: randomSymbolName(),
      timeframe: randomTimeframe(),
      year: format(date, 'yyyy') as Year,
      month: format(date, 'MM') as Month,
      day: format(date, 'dd') as Day,
    };
  }
  function createRequest() {
    return faker.helpers.arrayElement([createMonthlyFileRequest, createDailyFileRequest])();
  }

  const httpError = createHttpError('ServerSideError', 'Mock', new Error());
  const extractFailedError = createFileServiceError('ExtractFileFailed', 'Mock');

  describe('WHEN start downloading klines monthly file', () => {
    it('THEN it should download file with correct options', async () => {
      const deps = mockDeps();
      const request = createMonthlyFileRequest();
      await executeT(downloadKlinesZipFile(deps, request));

      const { PUBLIC_DATA_BASE_URL, DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
      expect(deps.httpClient.downloadFile).toHaveBeenCalledExactlyOnceWith({
        method: 'GET',
        url: expect.toSatisfy(
          allPass([
            includes(PUBLIC_DATA_BASE_URL),
            includes(request.symbol),
            includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
            includes(request.year),
            includes(request.month),
          ]),
        ),
        outputPath: expect.toSatisfy(
          allPass([
            includes(DOWNLOAD_OUTPUT_PATH),
            includes(request.executionId),
            includes(request.symbol),
            includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
            includes(request.year),
            includes(request.month),
            includes('.zip'),
          ]),
        ),
      });
    });
  });

  describe('WHEN start downloading klines daily file', () => {
    it('THEN it should download file with correct options', async () => {
      const deps = mockDeps();
      const request = createDailyFileRequest();
      await executeT(downloadKlinesZipFile(deps, request));

      const { PUBLIC_DATA_BASE_URL, DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
      expect(deps.httpClient.downloadFile).toHaveBeenCalledExactlyOnceWith({
        method: 'GET',
        url: expect.toSatisfy(
          allPass([
            includes(PUBLIC_DATA_BASE_URL),
            includes(request.symbol),
            includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
            includes(request.year),
            includes(request.month),
            includes(request.day),
          ]),
        ),
        outputPath: expect.toSatisfy(
          allPass([
            includes(DOWNLOAD_OUTPUT_PATH),
            includes(request.executionId),
            includes(request.symbol),
            includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
            includes(request.year),
            includes(request.month),
            includes(request.day),
          ]),
        ),
      });
    });
  });

  describe('WHEN downloading file fails', () => {
    it('THEN it should return Left of error', async () => {
      const deps = mockDeps({ httpClient: { downloadFile: () => te.left(httpError) } });
      const result = await executeT(downloadKlinesZipFile(deps, createRequest()));

      expect(result).toEqualLeft(expect.toSatisfy(isHttpError));
    });
  });

  describe('WHEN downloading file succeeds', () => {
    it('THEN it should extract the downloaded zip file', async () => {
      const deps = mockDeps();
      await executeT(downloadKlinesZipFile(deps, createRequest()));

      expect(deps.fileService.extractZipFile).toHaveBeenCalledExactlyOnceWith(
        expect.toInclude('.zip'),
        expect.toInclude('.csv'),
      );
    });

    describe('WHEN extracting zip file fails', () => {
      it('THEN it should return Left of error', async () => {
        const deps = mockDeps({ fileService: { extractZipFile: () => te.left(extractFailedError) } });
        const result = await executeT(downloadKlinesZipFile(deps, createRequest()));

        expect(result).toEqualLeft(expect.toSatisfy(isFileServiceError));
      });
    });

    describe('WHEN extracting zip file succeeds', () => {
      it('THEN it should return Right of CSV file path', async () => {
        const request = createRequest();
        const result = await executeT(downloadKlinesZipFile(mockDeps(), request));

        const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
        expect(result).toEqualRight(
          expect.toSatisfy(
            allPass([
              includes(DOWNLOAD_OUTPUT_PATH),
              includes(request.executionId),
              includes(request.symbol),
              includes(request.timeframe === '1M' ? '1mo' : request.timeframe),
              includes(request.year),
              includes(request.month),
              includes('.csv'),
            ]),
          ),
        );
      });
    });
  });
});
