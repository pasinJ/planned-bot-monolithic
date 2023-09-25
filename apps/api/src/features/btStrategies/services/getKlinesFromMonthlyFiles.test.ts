import { addMonths, startOfMonth } from 'date-fns';
import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight, repeat } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { exchangeNameEnum } from '#features/shared/domain/exchange.js';
import { createHttpError } from '#infra/http/client.error.js';
import { isBnbServiceError } from '#infra/services/binance/error.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { DateRange } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { randomDate } from '#test-utils/faker/date.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { randomPositiveInt } from '#test-utils/faker/number.js';
import { mockKline, randomBtExecutionId } from '#test-utils/features/btStrategies/models.js';
import { randomTimeframe, randomTimeframeExclude } from '#test-utils/features/shared/domain.js';
import { randomSymbolName } from '#test-utils/features/symbols/models.js';

import {
  GetKlinesFromMonthlyFilesDeps,
  GetKlinesFromMonthlyFilesRequest,
  getKlinesFromMonthlyFiles,
  getListOfMonths,
} from './getKlinesFromMonthlyFiles.js';

describe('UUT: Get list of months', () => {
  describe('[WHEN] get list of months', () => {
    it('[THEN] it will return a list of months in the given range', () => {
      const range = { start: new Date('2023-01-05'), end: new Date('2023-04-10') } as DateRange;

      expect(getListOfMonths(range)).toEqual([
        { year: '2023', month: '01' },
        { year: '2023', month: '02' },
        { year: '2023', month: '03' },
        { year: '2023', month: '04' },
      ]);
    });
  });
});

describe('UUT: Get klines from monthly files', () => {
  function mockDeps(overrides?: DeepPartial<GetKlinesFromMonthlyFilesDeps>): GetKlinesFromMonthlyFilesDeps {
    return mergeDeepRight(
      {
        httpClient: { downloadFile: jest.fn().mockReturnValue(te.right(undefined)) },
        fileService: {
          extractZipFile: jest.fn().mockReturnValue(te.right(undefined)),
          readCsvFile: jest.fn().mockReturnValue(te.right([])),
        },
        bnbService: {
          getKlinesFromDailyFiles: jest.fn().mockReturnValue(te.right([])),
          getKlinesFromApi: jest.fn().mockReturnValue(te.right([])),
        },
      },
      overrides ?? {},
    ) as GetKlinesFromMonthlyFilesDeps;
  }
  function createRequest(
    overrides?: Partial<GetKlinesFromMonthlyFilesRequest>,
  ): GetKlinesFromMonthlyFilesRequest {
    return {
      executionId: randomBtExecutionId(),
      symbol: randomSymbolName(),
      timeframe: randomTimeframe(),
      dateRange: createDateRange(),
      ...overrides,
    };
  }
  function createDateRange(monthsDiff = 3): DateRange {
    const start = randomDate();
    return { start, end: addMonths(start, monthsDiff - 1) } as DateRange;
  }

  const readCsvError = createGeneralError('ReadCsvFileFailed', 'Mock');
  const httpError = createHttpError('ServerSideError', 'Mock', new Error());
  const notFoundError = createHttpError('NotFound', 'Mock', new Error());
  const getKlinesApiError = createGeneralError('GetKlinesFromApiFailed', 'Mock', new Error());
  const getKlinesDailyError = createGeneralError('GetKlinesFromDailyFilesFailed', 'Mock', new Error());
  const csvFileContent = [
    [
      '1694649600000',
      '0.23440000',
      '0.24470000',
      '0.23240000',
      '0.24440000',
      '108910.40000000',
      '1694735999999',
      '25878.78325000',
      '249',
      '53757.80000000',
      '12872.91321000',
      '0',
    ],
  ];
  const csvKlines = (symbol: string, timeframe: string) => ({
    exchange: exchangeNameEnum.BINANCE,
    symbol: symbol,
    timeframe: timeframe,
    openTimestamp: new Date(1694649600000),
    closeTimestamp: new Date(1694735999999),
    open: 0.2344,
    high: 0.2447,
    low: 0.2324,
    close: 0.2444,
    volume: 108910.4,
    quoteAssetVolume: 25878.78325,
    numTrades: 249,
    takerBuyBaseAssetVolume: 53757.8,
    takerBuyQuoteAssetVolume: 12872.91321,
  });

  describe('[WHEN] get klines from monthly files', () => {
    it('[THEN] it will download file for each month in the date range', async () => {
      const deps = mockDeps();
      const monthsDiff = randomPositiveInt();
      const request = createRequest({ dateRange: createDateRange(monthsDiff) });

      await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(deps.httpClient.downloadFile).toHaveBeenCalledTimes(monthsDiff);
    });
  });

  describe('[WHEN] get klines from monthly files [AND] all downloadings succeeds', () => {
    it('[THEN] it will read each downloaded CSV file', async () => {
      const deps = mockDeps();
      const monthsDiff = randomPositiveInt();
      const request = createRequest({ dateRange: createDateRange(monthsDiff) });

      await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(monthsDiff);
    });
  });

  describe('[WHEN] get klines from monthly files [AND] all downloadings succeeds [AND] all readings CSV file succeed', () => {
    it('[THEN] it will return Right of array of klines from those CSV files', async () => {
      const deps = mockDeps({
        fileService: { readCsvFile: jest.fn().mockReturnValue(te.right(csvFileContent)) },
      });
      const monthsDiff = 2;
      const request = createRequest({ dateRange: createDateRange(monthsDiff) });

      const result = await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(result).toEqualRight(repeat(csvKlines(request.symbol, request.timeframe), monthsDiff));
    });
  });

  describe('[WHEN] get klines from monthly files [BUT] some downloading fails with Http error other than Not Found error', () => {
    it('[THEN] it will return Left of Error', async () => {
      const deps = mockDeps({ httpClient: { downloadFile: () => te.left(httpError) } });

      const result = await executeT(getKlinesFromMonthlyFiles(deps)(createRequest()));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });

  describe('[WHEN] get klines from monthly files [BUT] some downloadings at the beginning of the date range fail with Not Found error', () => {
    it('[THEN] it will read CSV file equal to the number of successful downloading', async () => {
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.left(notFoundError))
            .mockReturnValueOnce(te.left(notFoundError))
            .mockReturnValue(te.right(undefined)),
        },
      });
      const request = createRequest({ dateRange: createDateRange(5) });

      await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('[WHEN] get klines from monthly files [BUT] some downloadings in the middle of the date range fail with Not Found error', () => {
    it('[THEN] it will return Left of Error', async () => {
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError))
            .mockReturnValue(te.right(undefined)),
        },
      });
      const request = createRequest({ dateRange: createDateRange(5) });

      const result = await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });

  describe('[WHEN] get klines from monthly files [BUT] one or two last downloadings at the end of the date range fail with Not Found error [AND] timeframe is 1s, 1m, or 3m', () => {
    it('[THEN] it will call daily fallback method with date range from start of the failed downloading to the end of date range', async () => {
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
      });
      const timeframe = randomTimeframe(['1s', '1m', '3m']);
      const request = createRequest({ timeframe, dateRange: createDateRange(3) });

      await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(deps.bnbService.getKlinesFromDailyFiles).toHaveBeenCalledExactlyOnceWith({
        ...request,
        dateRange: { start: startOfMonth(request.dateRange.end), end: request.dateRange.end },
      });
    });
    it('[THEN] it will return Right of klines combined from both fallback and CSV files', async () => {
      const fallbackKlines = generateArrayOf(mockKline, 3);
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
        fileService: { readCsvFile: jest.fn().mockReturnValue(te.right(csvFileContent)) },
        bnbService: { getKlinesFromDailyFiles: () => te.right(fallbackKlines) },
      });
      const daysDiff = 2;
      const timeframe = randomTimeframe(['1s', '1m', '3m']);
      const request = createRequest({ timeframe, dateRange: createDateRange(daysDiff) });

      const result = await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(result).toEqualRight([csvKlines(request.symbol, request.timeframe), ...fallbackKlines]);
    });
  });

  describe('[WHEN] get klines from monthly files [BUT] one or two last downloadings at the end of the date range fail with Not Found error [AND] timeframe is not 1s, 1m, or 3m', () => {
    it('[THEN] it will call API fallback method with date range from start of the failed downloading to the end of date range parameter', async () => {
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
      });
      const timeframe = randomTimeframeExclude(['1s', '1m', '3m']);
      const request = createRequest({ timeframe, dateRange: createDateRange(3) });

      await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(deps.bnbService.getKlinesFromApi).toHaveBeenCalledExactlyOnceWith({
        symbol: request.symbol,
        timeframe: request.timeframe,
        dateRange: { start: startOfMonth(request.dateRange.end), end: request.dateRange.end },
      });
    });
    it('[THEN] it will return Right of klines combined from both fallback and CSV files', async () => {
      const fallbackKlines = generateArrayOf(mockKline, 3);
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
        fileService: { readCsvFile: jest.fn().mockReturnValue(te.right(csvFileContent)) },
        bnbService: { getKlinesFromApi: () => te.right(fallbackKlines) },
      });
      const daysDiff = 2;
      const timeframe = randomTimeframeExclude(['1s', '1m', '3m']);
      const request = createRequest({ timeframe, dateRange: createDateRange(daysDiff) });

      const result = await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(result).toEqualRight([csvKlines(request.symbol, request.timeframe), ...fallbackKlines]);
    });
  });

  describe('[WHEN] get klines from monthly files [BUT] one or two last downloadings at the end of the date range fail with Not Found error [AND] fallback method succeeds', () => {
    it('[THEN] it will call read CSV file for each successful downloading', async () => {
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
      });

      await executeT(getKlinesFromMonthlyFiles(deps)(createRequest({ dateRange: createDateRange(3) })));

      expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(2);
    });
  });

  describe('[WHEN] get klines from monthly files [BUT] one or two last downloadings at the end of the date range fail with Not Found error [AND] fallback method fails', () => {
    it('[THEN] it will return Left of error', async () => {
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
        bnbService: {
          getKlinesFromDailyFiles: () => te.left(getKlinesDailyError),
          getKlinesFromApi: () => te.left(getKlinesApiError),
        },
      });
      const request = createRequest({ dateRange: createDateRange(3) });

      const result = await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });

  describe('[WHEN] get klines from monthly files [BUT] more than last 2 downloadings at the end of the date range fail with Not Found error', () => {
    it('[THEN] it will return Left of error', async () => {
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError))
            .mockReturnValueOnce(te.left(notFoundError))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
      });
      const request = createRequest({ dateRange: createDateRange(4) });

      const result = await executeT(getKlinesFromMonthlyFiles(deps)(request));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });

  describe('[WHEN] get klines from monthly files [BUT] some reading CSV file fail', () => {
    it('[THEN] it will return Left of error', async () => {
      const deps = mockDeps({
        fileService: {
          readCsvFile: jest.fn().mockReturnValueOnce(te.left(readCsvError)).mockReturnValue(te.right([])),
        },
      });

      const result = await executeT(getKlinesFromMonthlyFiles(deps)(createRequest()));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
});
