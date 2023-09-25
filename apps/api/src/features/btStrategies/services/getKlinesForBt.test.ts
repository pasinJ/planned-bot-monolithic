/* eslint-disable jest/no-identical-title */
import { differenceInDays } from 'date-fns';
import { isBefore } from 'date-fns/fp';
import te from 'fp-ts/lib/TaskEither.js';
import { allPass, includes, mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { Timeframe, timeframeEnum } from '#features/shared/domain/timeframe.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { createBnbServiceError, isBnbServiceError } from '#infra/services/binance/error.js';
import { createFileServiceError } from '#infra/services/file/error.js';
import { DateRange } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { randomBeforeAndAfterDateInPast } from '#test-utils/faker/date.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import {
  mockKline,
  randomBtExecutionId,
  randomMaxKlinesNum,
} from '#test-utils/features/btStrategies/models.js';
import { randomTimeframe } from '#test-utils/features/shared/domain.js';
import { randomSymbolName } from '#test-utils/features/symbols/models.js';

import { BtEndTimestamp, BtStartTimestamp, MaxNumKlines } from '../dataModels/btStrategy.js';
import {
  GetKlinesForBtDeps,
  GetKlinesForBtRequest,
  approximateNumOfApiCalls,
  calculateNumOfDailyFiles,
  calculateNumOfMonthlyFiles,
  extendDateRangeToIncludeRequiredNumOfKlines,
  getKlinesForBt,
} from './getKlinesForBt.js';

describe('UUT: Get klines for backtesting', () => {
  function mockDepsAndRequest(overrides?: {
    deps?: DeepPartial<GetKlinesForBtDeps>;
    request?: Partial<GetKlinesForBtRequest>;
  }): { deps: GetKlinesForBtDeps; request: GetKlinesForBtRequest } {
    const { before, after } = randomBeforeAndAfterDateInPast();

    const deps = mergeDeepRight(
      {
        fileService: {
          createDirectory: jest.fn().mockReturnValue(te.right(undefined)),
          removeDirectory: jest.fn().mockReturnValue(te.right(undefined)),
        },
        bnbService: {
          getKlinesFromMonthlyFiles: jest.fn().mockReturnValue(te.right([])),
          getKlinesFromDailyFiles: jest.fn().mockReturnValue(te.right([])),
          getKlinesFromApi: jest.fn().mockReturnValue(te.right([])),
        },
      },
      overrides?.deps ?? {},
    ) as GetKlinesForBtDeps;
    const request = {
      executionId: randomBtExecutionId(),
      symbol: randomSymbolName(),
      timeframe: randomTimeframe(),
      maxKlinesNum: randomMaxKlinesNum(),
      startTimestamp: before as BtStartTimestamp,
      endTimestamp: after as BtEndTimestamp,
      ...overrides?.request,
    };

    return { deps, request };
  }
  function getApiTestCases(
    timeframe: Timeframe,
    startTimestamp: BtStartTimestamp,
    endTimestamp: BtEndTimestamp,
  ) {
    it('[THEN] it will get klines from API', async () => {
      const { deps, request } = mockDepsAndRequest({
        request: { timeframe, startTimestamp, endTimestamp },
      });

      await executeT(getKlinesForBt(deps)(request));

      expect(deps.bnbService.getKlinesFromApi).toHaveBeenCalledExactlyOnceWith({
        symbol: request.symbol,
        timeframe: request.timeframe,
        dateRange: {
          start: expect.toSatisfy(isBefore(request.startTimestamp)),
          end: request.endTimestamp,
        },
      });
    });
    it('[THEN] it will return Right of kline models array', async () => {
      const klines = generateArrayOf(mockKline, 3);
      const { deps, request } = mockDepsAndRequest({
        deps: { bnbService: { getKlinesFromApi: () => te.right(klines) } },
        request: { timeframe, startTimestamp, endTimestamp },
      });

      const result = await executeT(getKlinesForBt(deps)(request));

      expect(result).toEqualRight(klines);
    });

    describe('BUT if getting klines from API fails', () => {
      it('[THEN] it will return Left of error', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: { bnbService: { getKlinesFromApi: () => te.left(getApiError) } },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  }
  function getMonthlyTestCases(
    timeframe: Timeframe,
    startTimestamp: BtStartTimestamp,
    endTimestamp: BtEndTimestamp,
  ) {
    it('[THEN] it will create directory for downloading files', async () => {
      const { deps, request } = mockDepsAndRequest({
        request: { timeframe, startTimestamp, endTimestamp },
      });

      await executeT(getKlinesForBt(deps)(request));

      const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
      expect(deps.fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(
        expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
      );
    });
    it('[THEN] it will get klines from monthly files', async () => {
      const { deps, request } = mockDepsAndRequest({
        request: { timeframe, startTimestamp, endTimestamp },
      });

      await executeT(getKlinesForBt(deps)(request));

      expect(deps.bnbService.getKlinesFromMonthlyFiles).toHaveBeenCalledExactlyOnceWith({
        executionId: request.executionId,
        symbol: request.symbol,
        timeframe: request.timeframe,
        dateRange: {
          start: expect.toSatisfy(isBefore(request.startTimestamp)),
          end: request.endTimestamp,
        },
      });
    });
    it('[THEN] it will remove created directory', async () => {
      const { deps, request } = mockDepsAndRequest({
        request: { timeframe, startTimestamp, endTimestamp },
      });

      await executeT(getKlinesForBt(deps)(request));

      const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
      expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
        expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
      );
    });
    it('[THEN] it will return Right of kline models array', async () => {
      const klines = generateArrayOf(mockKline, 3);
      const { deps, request } = mockDepsAndRequest({
        deps: { bnbService: { getKlinesFromMonthlyFiles: () => te.right(klines) } },
        request: { timeframe, startTimestamp, endTimestamp },
      });

      const result = await executeT(getKlinesForBt(deps)(request));

      expect(result).toEqualRight(klines);
    });

    describe('BUT if creating directory fails', () => {
      it('[THEN] it will return Left of error', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: { fileService: { createDirectory: () => te.left(createDirError) } },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });

    describe('BUT if getting klines from monthly files fails', () => {
      it('[THEN] it will return Left of error', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: { bnbService: { getKlinesFromMonthlyFiles: () => te.left(getMonthlyFilesError) } },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
      it('[THEN] it will remove created directory', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: { bnbService: { getKlinesFromMonthlyFiles: () => te.left(getMonthlyFilesError) } },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        await executeT(getKlinesForBt(deps)(request));

        const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
        expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
          expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
        );
      });
    });

    describe('BUT if removing directory fails', () => {
      it('[THEN] it will still return Right of kline models array', async () => {
        const klines = generateArrayOf(mockKline, 3);
        const { deps, request } = mockDepsAndRequest({
          deps: {
            bnbService: { getKlinesFromMonthlyFiles: () => te.right(klines) },
            fileService: { removeDirectory: () => te.left(removeDirError) },
          },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualRight(klines);
      });
    });
  }
  function getDailyTestCases(
    timeframe: Timeframe,
    startTimestamp: BtStartTimestamp,
    endTimestamp: BtEndTimestamp,
  ) {
    it('[THEN] it will create directory for downloading files', async () => {
      const { deps, request } = mockDepsAndRequest({
        request: { timeframe, startTimestamp, endTimestamp },
      });

      await executeT(getKlinesForBt(deps)(request));

      const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
      expect(deps.fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(
        expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
      );
    });
    it('[THEN] it will get klines from daily files', async () => {
      const { deps, request } = mockDepsAndRequest({
        request: { timeframe, startTimestamp, endTimestamp },
      });

      await executeT(getKlinesForBt(deps)(request));

      expect(deps.bnbService.getKlinesFromDailyFiles).toHaveBeenCalledExactlyOnceWith({
        executionId: request.executionId,
        symbol: request.symbol,
        timeframe: request.timeframe,
        dateRange: {
          start: expect.toSatisfy(isBefore(request.startTimestamp)),
          end: request.endTimestamp,
        },
      });
    });
    it('[THEN] it will remove created directory', async () => {
      const { deps, request } = mockDepsAndRequest({
        request: { timeframe, startTimestamp, endTimestamp },
      });

      await executeT(getKlinesForBt(deps)(request));

      const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
      expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
        expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
      );
    });
    it('[THEN] it will return Right of kline models array', async () => {
      const klines = generateArrayOf(mockKline, 3);
      const { deps, request } = mockDepsAndRequest({
        deps: { bnbService: { getKlinesFromDailyFiles: () => te.right(klines) } },
        request: { timeframe, startTimestamp, endTimestamp },
      });

      const result = await executeT(getKlinesForBt(deps)(request));

      expect(result).toEqualRight(klines);
    });

    describe('BUT if creating directory fails', () => {
      it('[THEN] it will return Left of error', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: { fileService: { createDirectory: () => te.left(createDirError) } },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });

    describe('BUT if getting klines from daily files fails', () => {
      it('[THEN] it will return Left of error', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: { bnbService: { getKlinesFromDailyFiles: () => te.left(getDailyFilesError) } },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
      it('[THEN] it will remove created directory', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: { bnbService: { getKlinesFromDailyFiles: () => te.left(getDailyFilesError) } },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        await executeT(getKlinesForBt(deps)(request));

        const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
        expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
          expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
        );
      });
    });

    describe('BUT if removing directory fails', () => {
      it('[THEN] it will still return Right of kline models array', async () => {
        const klines = generateArrayOf(mockKline, 3);
        const { deps, request } = mockDepsAndRequest({
          deps: {
            bnbService: { getKlinesFromDailyFiles: () => te.right(klines) },
            fileService: { removeDirectory: () => te.left(removeDirError) },
          },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualRight(klines);
      });
    });
  }

  const createDirError = createFileServiceError('CreateDirFailed', 'Mock');
  const removeDirError = createFileServiceError('RemoveDirFailed', 'Mock');
  const getMonthlyFilesError = createBnbServiceError('GetKlinesFromMonthlyFilesFailed', 'Mock');
  const getDailyFilesError = createBnbServiceError('GetKlinesFromDailyFilesFailed', 'Mock');
  const getApiError = createBnbServiceError('GetKlinesFromApiFailed', 'Mock');

  describe('[WHEN] get klines for backtesting with timeframe is one of 1M, 1w, 3d, 1d, 12h, 8h, or 6h', () => {
    const timeframe = randomTimeframe(['1M', '1w', '3d', '1d', '12h', '8h', '6h']);
    const { before, after } = randomBeforeAndAfterDateInPast();

    getApiTestCases(timeframe, before as BtStartTimestamp, after as BtEndTimestamp);
  });

  describe('[WHEN] get klines for backtesting with timeframe is one of 4h, 2h, 1h, 30m, 15m, 5m, or 3m', () => {
    const timeframe = randomTimeframe(['4h', '2h', '1h', '30m', '15m', '5m', '3m']);

    describe('AND approximated number of API calls <= 10 and <= number of monthly files multiply by 5', () => {
      const startTimestamp = new Date('2022-06-06') as BtStartTimestamp;
      const endTimestamp = new Date('2022-06-10') as BtEndTimestamp;

      getApiTestCases(timeframe, startTimestamp, endTimestamp);
    });

    describe('AND approximated number of API calls > 10 or > number of monthly files multiply by 5', () => {
      const startTimestamp = new Date('2000-06-06') as BtStartTimestamp;
      const endTimestamp = new Date('2022-06-06') as BtEndTimestamp;

      getMonthlyTestCases(timeframe, startTimestamp, endTimestamp);
    });
  });

  describe('[WHEN] get klines for backtesting with timeframe is one of 1m or 1s', () => {
    const timeframe = randomTimeframe(['1m', '1s']);

    describe('AND approximated number of API calls <= 10 and <= number of monthly files multiply by 5', () => {
      const startTimestamp = new Date('2022-06-06T12:00:00') as BtStartTimestamp;
      const endTimestamp = new Date('2022-06-06T13:00:00') as BtEndTimestamp;

      getApiTestCases(timeframe, startTimestamp, endTimestamp);
    });

    describe('AND approximated number of API calls > 10 but number of daily files <= 10', () => {
      const startTimestamp = new Date('2022-06-07') as BtStartTimestamp;
      const endTimestamp = new Date('2022-06-15') as BtEndTimestamp;

      getDailyTestCases(timeframe, startTimestamp, endTimestamp);
    });

    describe('AND approximated number of API calls > 10 and number of daily files > 10', () => {
      const startTimestamp = new Date('2022-06-06') as BtStartTimestamp;
      const endTimestamp = new Date('2022-06-20') as BtEndTimestamp;

      getMonthlyTestCases(timeframe, startTimestamp, endTimestamp);
    });
  });
});

describe('UUT: Extend date range to include required number of klines', () => {
  describe('[WHEN] extend date range', () => {
    it('[THEN] it will return start timestamp that is as date before the input start timestamp [AND] keep the end timestamp as input', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;
      const timeframe = timeframeEnum['1d'];
      const maxNumKlines = 5 as MaxNumKlines;

      const result = extendDateRangeToIncludeRequiredNumOfKlines(range, timeframe, maxNumKlines);

      expect(result.start).toSatisfy(isBefore(range.start));
      expect(result.end).toEqual(range.end);
    });
  });

  describe('[WHEN] extend date range with timeframe = "1d" and maximum number of klines = 5', () => {
    it('[THEN] it will return start that has difference from the input start timestamp equals to 5 days', () => {
      const range = {
        start: new Date('2022-04-03 12:30:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;
      const timeframe = timeframeEnum['1d'];
      const maxNumKlines = 5 as MaxNumKlines;

      const result = extendDateRangeToIncludeRequiredNumOfKlines(range, timeframe, maxNumKlines);
      expect(differenceInDays(range.start, result.start)).toBe(5);
    });
  });
});

describe('UUT: Approximate number of API calls', () => {
  describe('[WHEN] approximate number of API calls with date range that does not cover any the end of kline', () => {
    it('[THEN] it will return 1', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;
      const timeframe = timeframeEnum['1d'];

      expect(approximateNumOfApiCalls(timeframe, range)).toBe(1);
    });
  });
  describe('[WHEN] approximate number of API calls with date range covers less than 1000 klines', () => {
    it('[THEN] it will return 1', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;
      const timeframe = timeframeEnum['1m'];

      expect(approximateNumOfApiCalls(timeframe, range)).toBe(1);
    });
  });
  describe('[WHEN] approximate number of API calls with date range covers more than 1000 but less than 2000 klines', () => {
    it('[THEN] it will return 2', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-04 14:00:00'),
      } as DateRange;
      const timeframe = timeframeEnum['1m'];

      expect(approximateNumOfApiCalls(timeframe, range)).toBe(2);
    });
  });
});

describe('UUT: Calculate number of monthly files', () => {
  describe('[WHEN] calculate number of monthly files with start and end of date range are in the same month', () => {
    it('[THEN] it will return 1', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;

      expect(calculateNumOfMonthlyFiles(range)).toBe(1);
    });
  });
  describe('[WHEN] calculate number of monthly files with date range covers 2 months', () => {
    it('[THEN] it will return 2', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-05-30 12:00:00'),
      } as DateRange;

      expect(calculateNumOfMonthlyFiles(range)).toBe(2);
    });
  });
});

describe('UUT: Calculate number of daily files', () => {
  describe('[WHEN] calculate number of daily files with start and end of date range are in the same day', () => {
    it('[THEN] it will return 1', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;

      expect(calculateNumOfDailyFiles(range)).toBe(1);
    });
  });
  describe('[WHEN] calculate number of daily files with date range covers 2 days', () => {
    it('[THEN] it will return 2', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-04 14:00:00'),
      } as DateRange;

      expect(calculateNumOfDailyFiles(range)).toBe(2);
    });
  });
});
