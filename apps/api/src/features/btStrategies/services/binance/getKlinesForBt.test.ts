import { differenceInDays } from 'date-fns';
import { isBefore } from 'date-fns/fp';
import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { BtExecutionId } from '#features/btStrategies/dataModels/btExecution.js';
import { SymbolName } from '#features/shared/symbol.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { createBnbServiceError, isBnbServiceError } from '#infra/services/binance/error.js';
import { DateRange } from '#shared/utils/date.js';
import { executeT } from '#shared/utils/fp.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { mockKline } from '#test-utils/features/shared/kline.js';

import { BtEndTimestamp, BtStartTimestamp, MaxNumKlines } from '../../dataModels/btStrategy.js';
import {
  GetKlinesForBtDeps,
  approximateNumOfApiCalls,
  calculateNumOfDailyFiles,
  calculateNumOfMonthlyFiles,
  chooseGetKlinesMethod,
  createTempDirAndRemoveAfterFinish,
  extendDateRangeToIncludeRequiredNumOfKlines,
  getKlinesForBt,
} from './getKlinesForBt.js';

describe('UUT: Get klines for backtesting', () => {
  function mockDeps(override?: DeepPartial<GetKlinesForBtDeps>): GetKlinesForBtDeps {
    return mergeDeepRight(
      {
        fileService: {
          createDirectory: jest.fn().mockReturnValue(te.right(undefined)),
          removeDirectory: jest.fn().mockReturnValue(te.right(undefined)),
        },
        bnbService: {
          getConfig: () => ({ DOWNLOAD_OUTPUT_PATH: downloadOutputPath }),
          getKlinesFromMonthlyFiles: jest.fn().mockReturnValue(te.right([])),
          getKlinesFromDailyFiles: jest.fn().mockReturnValue(te.right([])),
          getKlinesFromApi: jest.fn().mockReturnValue(te.right([])),
        },
      },
      override ?? {},
    ) as GetKlinesForBtDeps;
  }

  const downloadOutputPath = './output';
  const getApiError = createBnbServiceError('GetKlinesFromApiFailed', 'Mock');

  describe('[GIVEN] timeframe is one of 1M, 1w, 3d, 1d, 12h, 8h, or 6h', () => {
    let deps: GetKlinesForBtDeps;
    const request = {
      executionId: 'noygKGDOSD' as BtExecutionId,
      symbol: 'ETHUSDT' as SymbolName,
      timeframe: timeframeEnum['1d'],
      maxKlinesNum: 10 as MaxNumKlines,
      startTimestamp: new Date('2010-11-12') as BtStartTimestamp,
      endTimestamp: new Date('2010-11-13') as BtEndTimestamp,
    };
    const klines = generateArrayOf(mockKline, 3);

    beforeEach(() => {
      deps = mockDeps({ bnbService: { getKlinesFromApi: jest.fn().mockReturnValue(te.right(klines)) } });
    });

    describe('[WHEN] get klines for backtesting', () => {
      it('[THEN] it will get klines from API', async () => {
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
        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualRight(klines);
      });
    });
  });
  describe('[GIVEN] timeframe is one of 1M, 1w, 3d, 1d, 12h, 8h, or 6h [AND] server return error', () => {
    const deps = mockDeps({ bnbService: { getKlinesFromApi: () => te.left(getApiError) } });
    const request = {
      executionId: 'noygKGDOSD' as BtExecutionId,
      symbol: 'ETHUSDT' as SymbolName,
      timeframe: timeframeEnum['1w'],
      maxKlinesNum: 10 as MaxNumKlines,
      startTimestamp: new Date('2010-11-12') as BtStartTimestamp,
      endTimestamp: new Date('2010-11-13') as BtEndTimestamp,
    };

    describe('[WHEN] get klines for backtesting', () => {
      it('[THEN] it will return Left of error', async () => {
        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });
  });

  describe('[GIVEN] timeframe is one of 4h, 2h, 1h, 30m, 15m, 5m, or 3m [AND] approximated number of API calls <= 10 and <= number of monthly files multiply by 5', () => {
    let deps: GetKlinesForBtDeps;
    const request = {
      executionId: 'noygKGDOSD' as BtExecutionId,
      symbol: 'ETHUSDT' as SymbolName,
      timeframe: timeframeEnum['2h'],
      maxKlinesNum: 10 as MaxNumKlines,
      startTimestamp: new Date('2022-06-06') as BtStartTimestamp,
      endTimestamp: new Date('2022-06-10') as BtEndTimestamp,
    };
    const klines = generateArrayOf(mockKline, 3);

    beforeEach(() => {
      deps = mockDeps({ bnbService: { getKlinesFromApi: jest.fn().mockReturnValue(te.right(klines)) } });
    });

    describe('[WHEN] get klines for backtesting', () => {
      it('[THEN] it will get klines from API', async () => {
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
        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualRight(klines);
      });
    });
  });
  describe('[GIVEN] timeframe is one of 4h, 2h, 1h, 30m, 15m, 5m, or 3m [AND] approximated number of API calls > 10 or > number of monthly files multiply by 5', () => {
    let deps: GetKlinesForBtDeps;
    const request = {
      executionId: 'noygKGDOSD' as BtExecutionId,
      symbol: 'ETHUSDT' as SymbolName,
      timeframe: timeframeEnum['2h'],
      maxKlinesNum: 10 as MaxNumKlines,
      startTimestamp: new Date('2000-06-06') as BtStartTimestamp,
      endTimestamp: new Date('2022-06-06') as BtEndTimestamp,
    };
    const klines = generateArrayOf(mockKline, 3);

    beforeEach(() => {
      deps = mockDeps({
        bnbService: { getKlinesFromMonthlyFiles: jest.fn().mockReturnValue(te.right(klines)) },
      });
    });

    describe('[WHEN] get klines for backtesting', () => {
      it('[THEN] it will create directory for downloading files', async () => {
        await executeT(getKlinesForBt(deps)(request));

        expect(deps.fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(
          `${downloadOutputPath}/${request.executionId}`,
        );
      });
      it('[THEN] it will get klines from monthly files', async () => {
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
        await executeT(getKlinesForBt(deps)(request));

        expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
          `${downloadOutputPath}/${request.executionId}`,
        );
      });
      it('[THEN] it will return Right of kline models array', async () => {
        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualRight(klines);
      });
    });
  });

  describe('[GIVEN] timeframe is one of 1m or 1s [AND] approximated number of API calls <= 10 and <= number of monthly files multiply by 5', () => {
    let deps: GetKlinesForBtDeps;
    const request = {
      executionId: 'noygKGDOSD' as BtExecutionId,
      symbol: 'ETHUSDT' as SymbolName,
      timeframe: timeframeEnum['1m'],
      maxKlinesNum: 10 as MaxNumKlines,
      startTimestamp: new Date('2022-06-06T12:00:00') as BtStartTimestamp,
      endTimestamp: new Date('2022-06-06T13:00:00') as BtEndTimestamp,
    };
    const klines = generateArrayOf(mockKline, 3);

    beforeEach(() => {
      deps = mockDeps({
        bnbService: { getKlinesFromApi: jest.fn().mockReturnValue(te.right(klines)) },
      });
    });

    describe('[WHEN] get klines for backtesting', () => {
      it('[THEN] it will get klines from API', async () => {
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
        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualRight(klines);
      });
    });
  });
  describe('[GIVEN] timeframe is one of 1m or 1s [AND] approximated number of API calls > 10 but number of daily files <= 10', () => {
    let deps: GetKlinesForBtDeps;
    const request = {
      executionId: 'noygKGDOSD' as BtExecutionId,
      symbol: 'ETHUSDT' as SymbolName,
      timeframe: timeframeEnum['1m'],
      maxKlinesNum: 10 as MaxNumKlines,
      startTimestamp: new Date('2022-06-07') as BtStartTimestamp,
      endTimestamp: new Date('2022-06-15') as BtEndTimestamp,
    };
    const klines = generateArrayOf(mockKline, 3);

    beforeEach(() => {
      deps = mockDeps({
        bnbService: { getKlinesFromDailyFiles: jest.fn().mockReturnValue(te.right(klines)) },
      });
    });

    describe('[WHEN] get klines for backtesting', () => {
      it('[THEN] it will create directory for downloading files', async () => {
        await executeT(getKlinesForBt(deps)(request));

        expect(deps.fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(
          `${downloadOutputPath}/${request.executionId}`,
        );
      });
      it('[THEN] it will get klines from daily files', async () => {
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
        await executeT(getKlinesForBt(deps)(request));

        expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
          `${downloadOutputPath}/${request.executionId}`,
        );
      });
      it('[THEN] it will return Right of kline models array', async () => {
        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualRight(klines);
      });
    });
  });
  describe('[GIVEN] timeframe is one of 1m or 1s [AND] approximated number of API calls > 10 and number of daily files > 10', () => {
    let deps: GetKlinesForBtDeps;
    const request = {
      executionId: 'noygKGDOSD' as BtExecutionId,
      symbol: 'ETHUSDT' as SymbolName,
      timeframe: timeframeEnum['1m'],
      maxKlinesNum: 10 as MaxNumKlines,
      startTimestamp: new Date('2022-06-06') as BtStartTimestamp,
      endTimestamp: new Date('2022-06-20') as BtEndTimestamp,
    };
    const klines = generateArrayOf(mockKline, 3);

    beforeEach(() => {
      deps = mockDeps({
        bnbService: { getKlinesFromMonthlyFiles: jest.fn().mockReturnValue(te.right(klines)) },
      });
    });

    describe('[WHEN] get klines for backtesting', () => {
      it('[THEN] it will create directory for downloading files', async () => {
        await executeT(getKlinesForBt(deps)(request));

        expect(deps.fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(
          `${downloadOutputPath}/${request.executionId}`,
        );
      });
      it('[THEN] it will get klines from monthly files', async () => {
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
        await executeT(getKlinesForBt(deps)(request));

        expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
          `${downloadOutputPath}/${request.executionId}`,
        );
      });
      it('[THEN] it will return Right of kline models array', async () => {
        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualRight(klines);
      });
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

describe('UUT: Choose get klines method', () => {
  describe('[GIVEN] timeframe is one of 1M, 1w, 3d, 1d, 12h, 8h, or 6h', () => {
    describe('[WHEN] choose get klines method', () => {
      it('[THEN] it will return "API"', () => {
        const timeframe = timeframeEnum['1d'];
        const dateRange = { start: new Date('2012-02-04'), end: new Date('2012-02-05') } as DateRange;

        const result = chooseGetKlinesMethod(timeframe, dateRange);

        expect(result).toBe('API');
      });
    });
  });

  describe('[GIVEN] timeframe is one of 4h, 2h, 1h, 30m, 15m, 5m, or 3m [AND] approximated number of API calls <= 10 and <= number of monthly files multiply by 5', () => {
    describe('[WHEN] choose get klines method', () => {
      it('[THEN] it will return "API"', () => {
        const timeframe = timeframeEnum['1h'];
        const dateRange = { start: new Date('2022-06-06'), end: new Date('2022-06-10') } as DateRange;

        const result = chooseGetKlinesMethod(timeframe, dateRange);

        expect(result).toBe('API');
      });
    });
  });
  describe('[GIVEN] timeframe is one of 4h, 2h, 1h, 30m, 15m, 5m, or 3m [AND] approximated number of API calls > 10 or > number of monthly files multiply by 5', () => {
    describe('[WHEN] choose get klines method', () => {
      it('[THEN] it will return "MONTHLY"', () => {
        const timeframe = timeframeEnum['1h'];
        const dateRange = { start: new Date('2000-06-06'), end: new Date('2022-06-06') } as DateRange;

        const result = chooseGetKlinesMethod(timeframe, dateRange);

        expect(result).toBe('MONTHLY');
      });
    });
  });

  describe('[GIVEN] timeframe is one of 1m or 1s [AND] approximated number of API calls <= 10 and <= number of monthly files multiply by 5', () => {
    describe('[WHEN] choose get klines method', () => {
      it('[THEN] it will return "API"', () => {
        const timeframe = timeframeEnum['1m'];
        const dateRange = {
          start: new Date('2022-06-06T12:00:00'),
          end: new Date('2022-06-06T13:00:00'),
        } as DateRange;

        const result = chooseGetKlinesMethod(timeframe, dateRange);

        expect(result).toBe('API');
      });
    });
  });
  describe('[GIVEN] timeframe is one of 1m or 1s [AND] approximated number of API calls > 10 but number of daily files <= 10', () => {
    describe('[WHEN] choose get klines method', () => {
      it('[THEN] it will return "DAILY"', () => {
        const timeframe = timeframeEnum['1m'];
        const dateRange = { start: new Date('2022-06-07'), end: new Date('2022-06-15') } as DateRange;

        const result = chooseGetKlinesMethod(timeframe, dateRange);

        expect(result).toBe('DAILY');
      });
    });
  });
  describe('[GIVEN] timeframe is one of 1m or 1s [AND] approximated number of API calls > 10 and number of daily files > 10', () => {
    describe('[WHEN] choose get klines method', () => {
      it('[THEN] it will return "MONTHLY"', () => {
        const timeframe = timeframeEnum['1m'];
        const dateRange = { start: new Date('2022-06-06'), end: new Date('2022-06-20') } as DateRange;

        const result = chooseGetKlinesMethod(timeframe, dateRange);

        expect(result).toBe('MONTHLY');
      });
    });
  });
});

describe('UUT: Create Temp directory and remove after finish', () => {
  describe('[GIVEN] creating directory succeeds [AND] the taskeither return Right', () => {
    let fileService: GetKlinesForBtDeps['fileService'];
    const dirPath = 'random/path/1';
    let teFn: te.TaskEither<unknown, unknown>;

    beforeEach(() => {
      fileService = {
        createDirectory: jest.fn().mockReturnValue(te.right(undefined)),
        removeDirectory: jest.fn().mockReturnValue(te.right(undefined)),
      };
      teFn = jest.fn(te.right(true));
    });
    describe('[WHEN] create Temp directory and remove after finish', () => {
      it('[THEN] it will create a directory with the given path', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(dirPath);
      });
      it('[THEN] it will execute the taskeither', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(teFn).toHaveBeenCalledOnce();
      });
      it('[THEN] it will remove the directory with the given path', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(dirPath);
      });
      it('[THEN] it will return result from the taskEither', async () => {
        const result = await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(result).toEqualRight(true);
      });
    });
  });
  describe('[GIVEN] creating directory succeeds [AND] the taskeither return Right [BUT] removing the directory fails', () => {
    let fileService: GetKlinesForBtDeps['fileService'];
    const dirPath = 'random/path/1';
    let teFn: te.TaskEither<unknown, unknown>;

    beforeEach(() => {
      fileService = {
        createDirectory: jest.fn().mockReturnValue(te.right(undefined)),
        removeDirectory: jest.fn().mockReturnValue(te.left('Error')),
      };
      teFn = jest.fn(te.right(true));
    });
    describe('[WHEN] create Temp directory and remove after finish', () => {
      it('[THEN] it will create a directory with the given path', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(dirPath);
      });
      it('[THEN] it will execute the taskeither', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(teFn).toHaveBeenCalledOnce();
      });
      it('[THEN] it will remove the directory with the given path', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(dirPath);
      });
      it('[THEN] it will still return result from the taskEither', async () => {
        const result = await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(result).toEqualRight(true);
      });
    });
  });

  describe('[GIVEN] creating directory succeeds [BUT] the taskeither return Left', () => {
    let fileService: GetKlinesForBtDeps['fileService'];
    const dirPath = 'random/path/1';
    let teFn: te.TaskEither<unknown, unknown>;

    beforeEach(() => {
      fileService = {
        createDirectory: jest.fn().mockReturnValue(te.right(undefined)),
        removeDirectory: jest.fn().mockReturnValue(te.right(undefined)),
      };
      teFn = jest.fn(te.left(false));
    });
    describe('[WHEN] create Temp directory and remove after finish', () => {
      it('[THEN] it will create a directory with the given path', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(dirPath);
      });
      it('[THEN] it will execute the taskeither', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(teFn).toHaveBeenCalledOnce();
      });
      it('[THEN] it will remove the directory with the given path', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(dirPath);
      });
      it('[THEN] it will return result from the taskEither', async () => {
        const result = await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(result).toEqualLeft(false);
      });
    });
  });

  describe('[GIVEN] creating directory fails', () => {
    let fileService: GetKlinesForBtDeps['fileService'];
    const dirPath = 'random/path/1';
    let teFn: te.TaskEither<unknown, unknown>;

    beforeEach(() => {
      fileService = {
        createDirectory: jest.fn().mockReturnValue(te.left('Error')),
        removeDirectory: jest.fn().mockReturnValue(te.right(undefined)),
      };
      teFn = jest.fn(te.right(true));
    });
    describe('[WHEN] create Temp directory and remove after finish', () => {
      it('[THEN] it will create a directory with the given path', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(dirPath);
      });
      it('[THEN] it will not execute the taskeither', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(teFn).not.toHaveBeenCalled();
      });
      it('[THEN] it will not try to remove the directory', async () => {
        await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(fileService.removeDirectory).not.toHaveBeenCalled();
      });
      it('[THEN] it will return Left', async () => {
        const result = await executeT(createTempDirAndRemoveAfterFinish(fileService, dirPath, teFn));

        expect(result).toBeLeft();
      });
    });
  });
});
