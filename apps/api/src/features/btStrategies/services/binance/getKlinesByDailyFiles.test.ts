import { startOfDay } from 'date-fns';
import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight, repeat } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { BtExecutionId } from '#features/btStrategies/dataModels/btExecution.js';
import { exchangeNameEnum } from '#features/shared/exchange.js';
import { SymbolName } from '#features/shared/symbol.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { createHttpError } from '#infra/http/client.error.js';
import { createBnbServiceError, isBnbServiceError } from '#infra/services/binance/error.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { DateRange } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { mockKline } from '#test-utils/features/shared/kline.js';

import { GetKlinesByDailyFilesDeps, getKlinesByDailyFiles, getListOfDays } from './getKlinesByDailyFiles.js';

describe('UUT: Get list of days', () => {
  describe('[WHEN] get list of months', () => {
    it('[THEN] it will a list of days in the given range', () => {
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

describe('UUT: Get klines by daily files', () => {
  function mockDeps(overrides?: DeepPartial<GetKlinesByDailyFilesDeps>): GetKlinesByDailyFilesDeps {
    return mergeDeepRight(
      {
        httpClient: { downloadFile: jest.fn().mockReturnValue(te.right(undefined)) },
        fileService: {
          extractZipFile: jest.fn().mockReturnValue(te.right(undefined)),
          readCsvFile: jest.fn().mockReturnValue(te.right([])),
        },
        bnbService: {
          getConfig: () => ({ PUBLIC_DATA_BASE_URL: baseUrl, DOWNLOAD_OUTPUT_PATH: downloadOutputPath }),
          getKlinesByApi: jest.fn().mockReturnValue(te.right([])),
        },
      },
      overrides ?? {},
    ) as GetKlinesByDailyFilesDeps;
  }

  const baseUrl = 'https://binance.com';
  const downloadOutputPath = './output';
  const readCsvError = createGeneralError('ReadCsvFileFailed', 'Mock');
  const httpError = createHttpError('ServerSideError', 'Mock', new Error());
  const notFoundError = createHttpError('NotFound', 'Mock', new Error());
  const getKlinesApiError = createBnbServiceError('GetKlinesByApiFailed', 'Mock', new Error());
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
    symbol,
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
    dateRange: { start: new Date('2021-04-01'), end: new Date('2021-04-03') } as DateRange,
  };

  describe('[GIVEN] all downloadings succeed [AND] all readings CSV file succeed', () => {
    let deps: GetKlinesByDailyFilesDeps;
    const request = defaultRequest;

    beforeEach(() => {
      deps = mockDeps({ fileService: { readCsvFile: jest.fn().mockReturnValue(te.right(csvFileContent)) } });
    });

    describe('[WHEN] get klines by daily files', () => {
      it('[THEN] it will download file for each day in date range', async () => {
        await executeT(getKlinesByDailyFiles(deps)(request));

        expect(deps.httpClient.downloadFile).toHaveBeenCalledTimes(3);
      });
      it('[THEN] it will call read each downloaded CSV file', async () => {
        await executeT(getKlinesByDailyFiles(deps)(request));

        expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(3);
      });
      it('[THEN] it will return Right of array of klines from those CSV files', async () => {
        const result = await executeT(getKlinesByDailyFiles(deps)(request));

        const expected = repeat(csvKlines(request.symbol, request.timeframe), 3);
        expect(result).toEqualRight(expected);
      });
    });
  });

  describe('[GIVEN] some downloading fails with Http error other than Not Found error', () => {
    describe('[WHEN] get klines by daily files', () => {
      it('[THEN] it will return Left of Error', async () => {
        const deps = mockDeps({ httpClient: { downloadFile: () => te.left(httpError) } });
        const request = defaultRequest;

        const result = await executeT(getKlinesByDailyFiles(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });
  describe('[GIVEN] some downloadings at the beginning of the date range fail with Not Found error', () => {
    describe('[WHEN] get klines by daily files', () => {
      it('[THEN] it will read CSV file equals to the number of successful downloading', async () => {
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
          dateRange: { start: new Date('2021-04-01'), end: new Date('2021-04-04') } as DateRange,
        };

        await executeT(getKlinesByDailyFiles(deps)(request));

        expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(2);
      });
    });
  });
  describe('[GIVEN] some downloadings in the middle of the date range fail with Not Found error', () => {
    describe('[WHEN] get klines by daily files', () => {
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
          dateRange: { start: new Date('2021-04-01'), end: new Date('2021-04-03') } as DateRange,
        };

        const result = await executeT(getKlinesByDailyFiles(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });
  describe('[GIVEN] one or two last downloading at the end of the date range fail with Not Found error', () => {
    let deps: GetKlinesByDailyFilesDeps;
    const request = {
      ...defaultRequest,
      dateRange: { start: new Date('2021-04-01'), end: new Date('2021-04-03') } as DateRange,
    };
    const fallbackKlines = generateArrayOf(mockKline, 2);

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
        bnbService: { getKlinesByApi: jest.fn().mockReturnValue(te.right(fallbackKlines)) },
      });
    });

    describe('[WHEN] get klines by daily files', () => {
      it('[THEN] it will call daily fallback method with date range from start of the failed downloading to the end of date range input', async () => {
        await executeT(getKlinesByDailyFiles(deps)(request));

        expect(deps.bnbService.getKlinesByApi).toHaveBeenCalledExactlyOnceWith({
          symbol: request.symbol,
          timeframe: request.timeframe,
          dateRange: { start: startOfDay(request.dateRange.end), end: request.dateRange.end },
        });
      });
      it('[THEN] it will read CSV file for each successful downloading', async () => {
        await executeT(getKlinesByDailyFiles(deps)(request));

        expect(deps.fileService.readCsvFile).toHaveBeenCalledTimes(2);
      });
      it('[THEN] it will return Right of klines combined from both fallback and CSV files', async () => {
        const result = await executeT(getKlinesByDailyFiles(deps)(request));

        const expected = [
          csvKlines(request.symbol, request.timeframe),
          csvKlines(request.symbol, request.timeframe),
          ...fallbackKlines,
        ];
        expect(result).toEqualRight(expected);
      });
    });
  });
  describe('[GIVEN] one or two last downloading at the end of the date range fail with Not Found error [BUT] some of fallback method fails', () => {
    it('[THEN] it will return Left of error', async () => {
      const deps = mockDeps({
        httpClient: {
          downloadFile: jest
            .fn()
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.right(undefined))
            .mockReturnValueOnce(te.left(notFoundError)),
        },
        bnbService: { getKlinesByApi: () => te.left(getKlinesApiError) },
      });
      const request = {
        ...defaultRequest,
        dateRange: { start: new Date('2021-04-01'), end: new Date('2021-04-03') } as DateRange,
      };

      const result = await executeT(getKlinesByDailyFiles(deps)(request));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
  describe('[GIVEN] more than last 2 downloadings at the end of the date range fail with Not Found error', () => {
    describe('[WHEN] get klines by daily files', () => {
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
          dateRange: { start: new Date('2021-04-01'), end: new Date('2021-04-04') } as DateRange,
        };

        const result = await executeT(getKlinesByDailyFiles(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });

  describe('[GIVEN] all downloadings succeed [BUT] some reading CSV file fail', () => {
    describe('[WHEN] get klines by daily files', () => {
      it('[THEN] it will return Left of error', async () => {
        const deps = mockDeps({
          fileService: {
            readCsvFile: jest.fn().mockReturnValueOnce(te.left(readCsvError)).mockReturnValue(te.right([])),
          },
        });
        const request = defaultRequest;

        const result = await executeT(getKlinesByDailyFiles(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });
});
