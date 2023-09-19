import { addDays, startOfDay } from 'date-fns';
import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight, repeat } from 'ramda';

import { exchangeNameEnum } from '#features/shared/domain/exchangeName.js';
import { createHttpError } from '#infra/http/client.error.js';
import { isBnbServiceError } from '#infra/services/binance/error.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { DeepPartial } from '#shared/helpers.type.js';
import { executeT } from '#shared/utils/fp.js';
import { randomTimeframe } from '#test-utils/domain.js';
import { generateArrayOf, randomAnyDate, randomPositiveInt } from '#test-utils/faker.js';
import { mockKline, randomExecutionId } from '#test-utils/features/btStrategies/models.js';
import { randomSymbolName } from '#test-utils/features/symbols/models.js';

import { DateRange } from './getKlinesForBt.js';
import {
  GetKlinesFromDailyFilesDeps,
  GetKlinesFromDailyFilesRequest,
  getKlinesFromDailyFiles,
  getListOfDays,
} from './getKlinesFromDailyFiles.js';

describe('Get list of days', () => {
  describe('WHEN get list of months', () => {
    it('THEN it should a list of days in the given range', () => {
      const range = { start: new Date('2023-04-06'), end: new Date('2023-04-10') } as DateRange;

      const result = getListOfDays(range);

      expect(result).toEqual([
        { year: '2023', month: '04', day: '06' },
        { year: '2023', month: '04', day: '07' },
        { year: '2023', month: '04', day: '08' },
        { year: '2023', month: '04', day: '09' },
        { year: '2023', month: '04', day: '10' },
      ]);
    });
  });
});

describe('Get klines from daily files', () => {
  function mockDeps(overrides?: DeepPartial<GetKlinesFromDailyFilesDeps>): GetKlinesFromDailyFilesDeps {
    return mergeDeepRight(
      {
        httpClient: { downloadFile: jest.fn().mockReturnValue(te.right(undefined)) },
        fileService: {
          extractZipFile: jest.fn().mockReturnValue(te.right(undefined)),
          readCsvFile: jest.fn().mockReturnValue(te.right([])),
        },
        bnbService: { getKlinesFromApi: jest.fn().mockReturnValue(te.right([])) },
      },
      overrides ?? {},
    ) as GetKlinesFromDailyFilesDeps;
  }
  function createRequest(
    overrides?: Partial<GetKlinesFromDailyFilesRequest>,
  ): GetKlinesFromDailyFilesRequest {
    return {
      executionId: randomExecutionId(),
      symbol: randomSymbolName(),
      timeframe: randomTimeframe(),
      dateRange: createDateRange(),
      ...overrides,
    };
  }
  function createDateRange(daysDiff = 3): DateRange {
    const start = randomAnyDate();
    return { start, end: addDays(start, daysDiff - 1) } as DateRange;
  }

  const readCsvError = createGeneralError('ReadCsvFileFailed', 'Mock');
  const httpError = createHttpError('ServerSideError', 'Mock', new Error());
  const notFoundError = createHttpError('NotFound', 'Mock', new Error());
  const getKlinesApiError = createGeneralError('GetKlinesFromApiFailed', 'Mock', new Error());
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

  describe('WHEN start getting klines from daily files', () => {
    it('THEN it should download file for each day in date range', async () => {
      const deps = mockDeps();
      const request = createRequest({ dateRange: createDateRange(3) });

      await executeT(getKlinesFromDailyFiles(deps)(request));

      expect(deps.httpClient.downloadFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('WHEN all downloadings succeeds', () => {
    it('THEN it should call read CSV file for each successful downloading', async () => {
      const deps = mockDeps();
      const daysDiff = randomPositiveInt();
      const request = createRequest({ dateRange: createDateRange(daysDiff) });

      await executeT(getKlinesFromDailyFiles(deps)(request));

      expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(daysDiff);
    });

    describe('WHEN reading CSV file fails at least once', () => {
      it('THEN it should return Left of error', async () => {
        const deps = mockDeps({
          fileService: {
            readCsvFile: jest.fn().mockReturnValueOnce(te.left(readCsvError)).mockReturnValue(te.right([])),
          },
        });

        const result = await executeT(getKlinesFromDailyFiles(deps)(createRequest()));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });

    describe('WHEN all readings CSV file succeed', () => {
      it('THEN it should return Right of array of klines from those CSV files', async () => {
        const deps = mockDeps({
          fileService: { readCsvFile: jest.fn().mockReturnValue(te.right(csvFileContent)) },
        });
        const daysDiff = 2;
        const request = createRequest({ dateRange: createDateRange(daysDiff) });

        const result = await executeT(getKlinesFromDailyFiles(deps)(request));

        expect(result).toEqualRight(repeat(csvKlines(request.symbol, request.timeframe), daysDiff));
      });
    });
  });

  describe('WHEN some downloading fails with Http error other than Not Found error', () => {
    it('THEN it should return Left of Error', async () => {
      const deps = mockDeps({ httpClient: { downloadFile: () => te.left(httpError) } });

      const result = await executeT(getKlinesFromDailyFiles(deps)(createRequest()));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });

  describe('WHEN some downloadings at the beginning of the date range fail with Not Found error', () => {
    it('THEN it should call read CSV file equal to the number of successful downloading', async () => {
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

      await executeT(getKlinesFromDailyFiles(deps)(request));

      expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('WHEN some downloadings in the middle of the date range fail with Not Found error', () => {
    it('THEN it should return Left of Error', async () => {
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

      const result = await executeT(getKlinesFromDailyFiles(deps)(request));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });

  describe('WHEN less than last 2 downloading at the end of the date range fail with Not Found error', () => {
    it('THEN it should call daily fallback method with date range from start of the failed downloading to the end of date range parameter', async () => {
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
      });
      const request = createRequest({ dateRange: createDateRange(3) });

      await executeT(getKlinesFromDailyFiles(deps)(request));

      expect(deps.bnbService.getKlinesFromApi).toHaveBeenCalledExactlyOnceWith({
        symbol: request.symbol,
        timeframe: request.timeframe,
        dateRange: { start: startOfDay(request.dateRange.end), end: request.dateRange.end },
      });
    });

    it('THEN it should call read CSV file for each successful downloading', async () => {
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
      });

      await executeT(getKlinesFromDailyFiles(deps)(createRequest({ dateRange: createDateRange(3) })));

      expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(2);
    });

    it('THEN it should return Right of klines combined from both fallback and CSV files', async () => {
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
      const request = createRequest({ dateRange: createDateRange(daysDiff) });

      const result = await executeT(getKlinesFromDailyFiles(deps)(request));

      expect(result).toEqualRight([csvKlines(request.symbol, request.timeframe), ...fallbackKlines]);
    });

    describe('WHEN some of fallback method fails', () => {
      it('THEN it should return Left of error', async () => {
        const deps = mockDeps({
          httpClient: {
            downloadFile: jest
              .fn()
              .mockReturnValueOnce(te.right(undefined))
              .mockReturnValueOnce(te.right(undefined))
              .mockReturnValueOnce(te.left(notFoundError)),
          },
          bnbService: { getKlinesFromApi: () => te.left(getKlinesApiError) },
        });
        const request = createRequest({ dateRange: createDateRange(3) });

        const result = await executeT(getKlinesFromDailyFiles(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });

  describe('WHEN more than last 2 downloading at the end of the date range fail with Not Found error', () => {
    it('THEN it should return Left of error', async () => {
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

      const result = await executeT(getKlinesFromDailyFiles(deps)(request));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
});
