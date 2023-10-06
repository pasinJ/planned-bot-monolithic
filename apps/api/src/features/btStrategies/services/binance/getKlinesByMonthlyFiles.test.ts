import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight, repeat } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { BtExecutionId } from '#features/btStrategies/dataModels/btExecution.js';
import { exchangeNameEnum } from '#features/shared/exchange.js';
import { SymbolName } from '#features/shared/symbol.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { createHttpError } from '#infra/http/client.error.js';
import { isBnbServiceError } from '#infra/services/binance/error.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { DateRange } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { mockKline } from '#test-utils/features/shared/kline.js';

import {
  GetKlinesByMonthlyFilesDeps,
  getKlinesByMonthlyFiles,
  getListOfMonths,
} from './getKlinesByMonthlyFiles.js';

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

describe('UUT: Get klines by monthly files', () => {
  function mockDeps(overrides?: DeepPartial<GetKlinesByMonthlyFilesDeps>): GetKlinesByMonthlyFilesDeps {
    return mergeDeepRight(
      {
        httpClient: { downloadFile: jest.fn().mockReturnValue(te.right(undefined)) },
        fileService: {
          extractZipFile: jest.fn().mockReturnValue(te.right(undefined)),
          readCsvFile: jest.fn().mockReturnValue(te.right([])),
        },
        bnbService: {
          getConfig: () => ({ PUBLIC_DATA_BASE_URL: baseUrl, DOWNLOAD_OUTPUT_PATH: downloadOutputPath }),
          getKlinesFromDailyFiles: jest.fn().mockReturnValue(te.right([])),
          getKlinesFromApi: jest.fn().mockReturnValue(te.right([])),
        },
      },
      overrides ?? {},
    ) as GetKlinesByMonthlyFilesDeps;
  }

  const baseUrl = 'https://binance.com';
  const downloadOutputPath = './output';
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
  const defaultRequest = {
    executionId: '5eT2tZRXuP' as BtExecutionId,
    symbol: 'ETHUSDT' as SymbolName,
    timeframe: timeframeEnum['30m'],
    dateRange: { start: new Date('2021-04'), end: new Date('2021-04') } as DateRange,
  };

  describe('[GIVEN] all downloadings succeeds [AND] all readings CSV file succeed', () => {
    let deps: GetKlinesByMonthlyFilesDeps;
    const request = {
      ...defaultRequest,
      dateRange: { start: new Date('2021-04'), end: new Date('2021-06') } as DateRange,
    };

    beforeEach(() => {
      deps = mockDeps({
        fileService: { readCsvFile: jest.fn().mockReturnValue(te.right(csvFileContent)) },
      });
    });

    describe('[WHEN] get klines by monthly files', () => {
      it('[THEN] it will download file for each month in the date range', async () => {
        await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(deps.httpClient.downloadFile).toHaveBeenCalledTimes(3);
      });
      it('[THEN] it will read each downloaded CSV file', async () => {
        await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(3);
      });
      it('[THEN] it will return Right of array of klines from those CSV files', async () => {
        const result = await executeT(getKlinesByMonthlyFiles(deps)(request));

        const expected = repeat(csvKlines(request.symbol, request.timeframe), 3);
        expect(result).toEqualRight(expected);
      });
    });
  });

  describe('[GIVEN] some downloading fails with Http error other than Not Found error', () => {
    describe('[WHEN] get klines by monthly files', () => {
      it('[THEN] it will return Left of Error', async () => {
        const deps = mockDeps({ httpClient: { downloadFile: () => te.left(httpError) } });
        const request = defaultRequest;

        const result = await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });
  describe('[GIVEN] some downloadings at the beginning of the date range fail with Not Found error', () => {
    describe('[WHEN] get klines by monthly files', () => {
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
        const request = {
          ...defaultRequest,
          dateRange: { start: new Date('2021-04'), end: new Date('2021-07') } as DateRange,
        };

        await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(2);
      });
    });
  });
  describe('[GIVEN] some downloadings in the middle of the date range fail with Not Found error', () => {
    describe('[WHEN] get klines by monthly files', () => {
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
        const request = {
          ...defaultRequest,
          dateRange: { start: new Date('2021-04'), end: new Date('2021-06') } as DateRange,
        };

        const result = await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });
  describe('[GIVEN] one or two last downloadings at the end of the date range fail with Not Found error [AND] timeframe is 1s, 1m, or 3m', () => {
    let deps: GetKlinesByMonthlyFilesDeps;
    const request = {
      ...defaultRequest,
      timeframe: timeframeEnum['1m'],
      dateRange: { start: new Date('2021-04'), end: new Date('2021-06-30T23:59:59.999Z') } as DateRange,
    };
    const fallbackKlines = generateArrayOf(mockKline, 3);

    beforeEach(() => {
      deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
        fileService: { readCsvFile: jest.fn().mockReturnValue(te.right(csvFileContent)) },
        bnbService: { getKlinesFromDailyFiles: jest.fn().mockReturnValue(te.right(fallbackKlines)) },
      });
    });

    describe('[WHEN] get klines by monthly files', () => {
      it('[THEN] it will call daily fallback method with date range from start of the failed downloading to the end of date range', async () => {
        await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(deps.bnbService.getKlinesFromDailyFiles).toHaveBeenCalledExactlyOnceWith({
          ...request,
          dateRange: {
            start: new Date('2021-06-01T00:00:00.000Z'),
            end: new Date('2021-06-30T23:59:59.999Z'),
          },
        });
      });
      it('[THEN] it will return Right of klines combined from both fallback and CSV files', async () => {
        const result = await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(result).toEqualRight([
          csvKlines(request.symbol, request.timeframe),
          csvKlines(request.symbol, request.timeframe),
          ...fallbackKlines,
        ]);
      });
    });
  });
  describe('[GIVEN] one or two last downloadings at the end of the date range fail with Not Found error [AND] timeframe is not 1s, 1m, or 3m', () => {
    let deps: GetKlinesByMonthlyFilesDeps;
    const request = {
      ...defaultRequest,
      timeframe: timeframeEnum['15m'],
      dateRange: { start: new Date('2021-04'), end: new Date('2021-06-30T23:59:59.999Z') } as DateRange,
    };
    const fallbackKlines = generateArrayOf(mockKline, 3);

    beforeEach(() => {
      deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
        fileService: { readCsvFile: jest.fn().mockReturnValue(te.right(csvFileContent)) },
        bnbService: { getKlinesFromApi: jest.fn().mockReturnValue(te.right(fallbackKlines)) },
      });
    });

    describe('[WHEN] get klines by monthly files', () => {
      it('[THEN] it will call API fallback method with date range from start of the failed downloading to the end of date range parameter', async () => {
        await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(deps.bnbService.getKlinesFromApi).toHaveBeenCalledExactlyOnceWith({
          symbol: request.symbol,
          timeframe: request.timeframe,
          dateRange: {
            start: new Date('2021-06-01T00:00:00.000Z'),
            end: new Date('2021-06-30T23:59:59.999Z'),
          },
        });
      });
      it('[THEN] it will return Right of klines combined from both fallback and CSV files', async () => {
        const result = await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(result).toEqualRight([
          csvKlines(request.symbol, request.timeframe),
          csvKlines(request.symbol, request.timeframe),
          ...fallbackKlines,
        ]);
      });
    });
  });
  describe('[GIVEN] one or two last downloadings at the end of the date range fail with Not Found error', () => {
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
      const request = {
        ...defaultRequest,
        dateRange: { start: new Date('2021-04'), end: new Date('2021-06') } as DateRange,
      };

      await executeT(getKlinesByMonthlyFiles(deps)(request));

      expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(2);
    });
  });
  describe('[GIVEN] one or two last downloadings at the end of the date range fail with Not Found error [AND] fallback method fails', () => {
    describe('[WHEN] get klines by monthly files', () => {
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
        const request = {
          ...defaultRequest,
          dateRange: { start: new Date('2021-04'), end: new Date('2021-06') } as DateRange,
        };

        const result = await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });
  describe('[GIVEN] more than last 2 downloadings at the end of the date range fail with Not Found error', () => {
    describe('[WHEN] get klines by monthly files', () => {
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
        const request = {
          ...defaultRequest,
          dateRange: { start: new Date('2021-04'), end: new Date('2021-07') } as DateRange,
        };

        const result = await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });

  describe('[GIVEN] all downloadings succeeds [BUT] some reading CSV file fail', () => {
    describe('[WHEN] get klines by monthly files', () => {
      it('[THEN] it will return Left of error', async () => {
        const deps = mockDeps({
          fileService: {
            readCsvFile: jest.fn().mockReturnValueOnce(te.left(readCsvError)).mockReturnValue(te.right([])),
          },
        });
        const request = defaultRequest;

        const result = await executeT(getKlinesByMonthlyFiles(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });
});
