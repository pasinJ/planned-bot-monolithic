/* eslint-disable jest/no-identical-title */
import { faker } from '@faker-js/faker';
import { differenceInDays } from 'date-fns';
import { isBefore } from 'date-fns/fp';
import te from 'fp-ts/lib/TaskEither.js';
import { allPass, includes, mergeDeepRight } from 'ramda';

import { Timeframe, timeframeEnum } from '#features/shared/domain/timeframe.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { createBnbServiceError, isBnbServiceError } from '#infra/services/binance/error.js';
import { createFileServiceError } from '#infra/services/file/error.js';
import { DeepPartial } from '#shared/helpers.type.js';
import { executeT } from '#shared/utils/fp.js';
import { randomTimeframe } from '#test-utils/domain.js';
import {
  generateArrayOf,
  randomAnyDate,
  randomBeforeAndAfterDate,
  randomBeforeAndAfterDateInPast,
} from '#test-utils/faker.js';
import {
  mockKline,
  randomExecutionId,
  randomMaxKlinesNum,
} from '#test-utils/features/btStrategies/models.js';
import { randomSymbolName } from '#test-utils/features/symbols/models.js';

import { MaxNumKlines } from '../data-models/btStrategy.js';
import {
  DateRange,
  GetKlinesForBtDeps,
  GetKlinesForBtRequest,
  approximateNumOfApiCalls,
  calculateNumOfDailyFiles,
  calculateNumOfMonthlyFiles,
  extendDateRangeByMaxNumKlines,
  getKlinesForBt,
  validateDateRange,
} from './getKlinesForBt.js';

describe('Get klines for backtesting', () => {
  function mockDepsAndRequest(overrides?: {
    deps?: DeepPartial<GetKlinesForBtDeps>;
    request?: Partial<GetKlinesForBtRequest>;
  }): { deps: GetKlinesForBtDeps; request: GetKlinesForBtRequest } {
    const currentDate = randomAnyDate();
    const { before, after } = randomBeforeAndAfterDateInPast(currentDate);

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
        dateService: { getCurrentDate: () => currentDate },
      },
      overrides?.deps ?? {},
    ) as GetKlinesForBtDeps;
    const request = {
      executionId: randomExecutionId(),
      symbol: randomSymbolName(),
      timeframe: randomTimeframe(),
      maxKlinesNum: randomMaxKlinesNum(),
      startTimestamp: before,
      endTimestamp: after,
      ...overrides?.request,
    };

    return { deps, request };
  }
  function getApiTestCases(
    timeframe: Timeframe,
    currentDate: Date,
    startTimestamp: Date,
    endTimestamp: Date,
  ) {
    it('THEN it should get klines from API', async () => {
      const { deps, request } = mockDepsAndRequest({
        deps: { dateService: { getCurrentDate: () => currentDate } },
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

    describe('WHEN getting klines from API fails', () => {
      it('THEN it should return Left of error', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: {
            dateService: { getCurrentDate: () => currentDate },
            bnbService: { getKlinesFromApi: () => te.left(getApiError) },
          },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });

    describe('WHEN getting klines from API succeeds', () => {
      it('THEN it should return Right of kline models array', async () => {
        const klines = generateArrayOf(mockKline, 3);
        const { deps, request } = mockDepsAndRequest({
          deps: {
            dateService: { getCurrentDate: () => currentDate },
            bnbService: { getKlinesFromApi: () => te.right(klines) },
          },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualRight(klines);
      });
    });
  }
  function getMonthlyTestCases(
    timeframe: Timeframe,
    currentDate: Date,
    startTimestamp: Date,
    endTimestamp: Date,
  ) {
    it('THEN it should create directory for downloading files', async () => {
      const { deps, request } = mockDepsAndRequest({
        deps: { dateService: { getCurrentDate: () => currentDate } },
        request: { timeframe, startTimestamp, endTimestamp },
      });

      await executeT(getKlinesForBt(deps)(request));

      const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
      expect(deps.fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(
        expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
      );
    });

    describe('WHEN creating directory fails', () => {
      it('THEN it should return Left of error', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: {
            dateService: { getCurrentDate: () => currentDate },
            fileService: { createDirectory: () => te.left(createDirError) },
          },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });

    describe('WHEN creating directory succeeds', () => {
      it('THEN it should get klines from monthly files', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: { dateService: { getCurrentDate: () => currentDate } },
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

      describe('WHEN getting klines from monthly files fails', () => {
        it('THEN it should return Left of error', async () => {
          const { deps, request } = mockDepsAndRequest({
            deps: {
              dateService: { getCurrentDate: () => currentDate },
              bnbService: { getKlinesFromMonthlyFiles: () => te.left(getMonthlyFilesError) },
            },
            request: { timeframe, startTimestamp, endTimestamp },
          });

          const result = await executeT(getKlinesForBt(deps)(request));

          expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
        });
        it('THEN it should remove created directory', async () => {
          const { deps, request } = mockDepsAndRequest({
            deps: {
              dateService: { getCurrentDate: () => currentDate },
              bnbService: { getKlinesFromMonthlyFiles: () => te.left(getMonthlyFilesError) },
            },
            request: { timeframe, startTimestamp, endTimestamp },
          });

          await executeT(getKlinesForBt(deps)(request));

          const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
          expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
            expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
          );
        });
      });

      describe('WHEN getting monthly files succeeds', () => {
        it('THEN it should remove created directory', async () => {
          const { deps, request } = mockDepsAndRequest({
            deps: { dateService: { getCurrentDate: () => currentDate } },
            request: { timeframe, startTimestamp, endTimestamp },
          });

          await executeT(getKlinesForBt(deps)(request));

          const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
          expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
            expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
          );
        });
        it('THEN it should return Right of kline models array', async () => {
          const klines = generateArrayOf(mockKline, 3);
          const { deps, request } = mockDepsAndRequest({
            deps: {
              dateService: { getCurrentDate: () => currentDate },
              bnbService: { getKlinesFromMonthlyFiles: () => te.right(klines) },
            },
            request: { timeframe, startTimestamp, endTimestamp },
          });

          const result = await executeT(getKlinesForBt(deps)(request));

          expect(result).toEqualRight(klines);
        });

        describe('WHEN removing directory fails', () => {
          it('THEN it should still return Right of kline models array', async () => {
            const klines = generateArrayOf(mockKline, 3);
            const { deps, request } = mockDepsAndRequest({
              deps: {
                dateService: { getCurrentDate: () => currentDate },
                bnbService: { getKlinesFromMonthlyFiles: () => te.right(klines) },
                fileService: { removeDirectory: () => te.left(removeDirError) },
              },
              request: { timeframe, startTimestamp, endTimestamp },
            });

            const result = await executeT(getKlinesForBt(deps)(request));

            expect(result).toEqualRight(klines);
          });
        });
      });
    });
  }
  function getDailyTestCases(
    timeframe: Timeframe,
    currentDate: Date,
    startTimestamp: Date,
    endTimestamp: Date,
  ) {
    it('THEN it should create directory for downloading files', async () => {
      const { deps, request } = mockDepsAndRequest({
        deps: { dateService: { getCurrentDate: () => currentDate } },
        request: { timeframe, startTimestamp, endTimestamp },
      });

      await executeT(getKlinesForBt(deps)(request));

      const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
      expect(deps.fileService.createDirectory).toHaveBeenCalledExactlyOnceWith(
        expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
      );
    });

    describe('WHEN creating directory fails', () => {
      it('THEN it should return Left of error', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: {
            dateService: { getCurrentDate: () => currentDate },
            fileService: { createDirectory: () => te.left(createDirError) },
          },
          request: { timeframe, startTimestamp, endTimestamp },
        });

        const result = await executeT(getKlinesForBt(deps)(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
      });
    });

    describe('WHEN creating directory succeeds', () => {
      it('THEN it should get klines from daily files', async () => {
        const { deps, request } = mockDepsAndRequest({
          deps: { dateService: { getCurrentDate: () => currentDate } },
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

      describe('WHEN getting klines from daily files fails', () => {
        it('THEN it should return Left of error', async () => {
          const { deps, request } = mockDepsAndRequest({
            deps: {
              dateService: { getCurrentDate: () => currentDate },
              bnbService: { getKlinesFromDailyFiles: () => te.left(getDailyFilesError) },
            },
            request: { timeframe, startTimestamp, endTimestamp },
          });

          const result = await executeT(getKlinesForBt(deps)(request));

          expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
        });
        it('THEN it should remove created directory', async () => {
          const { deps, request } = mockDepsAndRequest({
            deps: {
              dateService: { getCurrentDate: () => currentDate },
              bnbService: { getKlinesFromDailyFiles: () => te.left(getDailyFilesError) },
            },
            request: { timeframe, startTimestamp, endTimestamp },
          });

          await executeT(getKlinesForBt(deps)(request));

          const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
          expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
            expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
          );
        });
      });

      describe('WHEN getting daily files succeeds', () => {
        it('THEN it should remove created directory', async () => {
          const { deps, request } = mockDepsAndRequest({
            deps: { dateService: { getCurrentDate: () => currentDate } },
            request: { timeframe, startTimestamp, endTimestamp },
          });

          await executeT(getKlinesForBt(deps)(request));

          const { DOWNLOAD_OUTPUT_PATH } = getBnbConfig();
          expect(deps.fileService.removeDirectory).toHaveBeenCalledExactlyOnceWith(
            expect.toSatisfy(allPass([includes(DOWNLOAD_OUTPUT_PATH), includes(request.executionId)])),
          );
        });
        it('THEN it should return Right of kline models array', async () => {
          const klines = generateArrayOf(mockKline, 3);
          const { deps, request } = mockDepsAndRequest({
            deps: {
              dateService: { getCurrentDate: () => currentDate },
              bnbService: { getKlinesFromDailyFiles: () => te.right(klines) },
            },
            request: { timeframe, startTimestamp, endTimestamp },
          });

          const result = await executeT(getKlinesForBt(deps)(request));

          expect(result).toEqualRight(klines);
        });

        describe('WHEN removing directory fails', () => {
          it('THEN it should still return Right of kline models array', async () => {
            const klines = generateArrayOf(mockKline, 3);
            const { deps, request } = mockDepsAndRequest({
              deps: {
                dateService: { getCurrentDate: () => currentDate },
                bnbService: { getKlinesFromDailyFiles: () => te.right(klines) },
                fileService: { removeDirectory: () => te.left(removeDirError) },
              },
              request: { timeframe, startTimestamp, endTimestamp },
            });

            const result = await executeT(getKlinesForBt(deps)(request));

            expect(result).toEqualRight(klines);
          });
        });
      });
    });
  }

  const createDirError = createFileServiceError('CreateDirFailed', 'Mock');
  const removeDirError = createFileServiceError('RemoveDirFailed', 'Mock');
  const getMonthlyFilesError = createBnbServiceError('GetKlinesFromMonthlyFilesFailed', 'Mock');
  const getDailyFilesError = createBnbServiceError('GetKlinesFromDailyFilesFailed', 'Mock');
  const getApiError = createBnbServiceError('GetKlinesFromApiFailed', 'Mock');

  describe('WHEN start timestamp and end timestamp is invalid', () => {
    it('THEN it should return Left of error', async () => {
      const currentDate = randomAnyDate();
      const { before, after } = randomBeforeAndAfterDate(currentDate);
      const { deps, request } = mockDepsAndRequest({
        deps: { dateService: { getCurrentDate: () => currentDate } },
        request: { startTimestamp: before, endTimestamp: after },
      });
      const result = await executeT(getKlinesForBt(deps)(request));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });

  describe('WHEN timeframe is one of 1M, 1w, 3d, 1d, 12h, 8h, or 6h', () => {
    const timeframe = randomTimeframe(['1M', '1w', '3d', '1d', '12h', '8h', '6h']);
    const currentDate = randomAnyDate();
    const { before, after } = randomBeforeAndAfterDateInPast(currentDate);

    getApiTestCases(timeframe, currentDate, before, after);
  });

  describe('WHEN timeframe is one of 4h, 2h, 1h, 30m, 15m, 5m, or 3m', () => {
    const timeframe = randomTimeframe(['4h', '2h', '1h', '30m', '15m', '5m', '3m']);

    describe('WHEN approximated number of API calls <= 10 and <= number of monthly files multiply by 5', () => {
      const currentDate = new Date('2023-12-12');
      const startTimestamp = new Date('2022-06-06');
      const endTimestamp = new Date('2022-06-10');

      getApiTestCases(timeframe, currentDate, startTimestamp, endTimestamp);
    });

    describe('WHEN approximated number of API calls > 10 or > number of monthly files multiply by 5', () => {
      const currentDate = new Date('2023-12-12');
      const startTimestamp = new Date('2000-06-06');
      const endTimestamp = new Date('2022-06-06');

      getMonthlyTestCases(timeframe, currentDate, startTimestamp, endTimestamp);
    });
  });

  describe('WHEN timeframe is one of 1m or 1s', () => {
    const timeframe = randomTimeframe(['1m', '1s']);

    describe('WHEN approximated number of API calls <= 10 and <= number of monthly files multiply by 5', () => {
      const currentDate = new Date('2023-12-12');
      const startTimestamp = new Date('2022-06-06T12:00:00');
      const endTimestamp = new Date('2022-06-06T13:00:00');

      getApiTestCases(timeframe, currentDate, startTimestamp, endTimestamp);
    });

    describe('WHEN approximated number of API calls > 10 but number of daily files <= 10', () => {
      const currentDate = new Date('2023-12-12');
      const startTimestamp = new Date('2022-06-07');
      const endTimestamp = new Date('2022-06-15');

      getDailyTestCases(timeframe, currentDate, startTimestamp, endTimestamp);
    });

    describe('WHEN approximated number of API calls > 10 and number of daily files > 10', () => {
      const currentDate = new Date('2023-12-12');
      const startTimestamp = new Date('2022-06-06');
      const endTimestamp = new Date('2022-06-20');

      getMonthlyTestCases(timeframe, currentDate, startTimestamp, endTimestamp);
    });
  });
});

describe('Validate date range', () => {
  describe('WHEN start timestamp equals to end timestamp', () => {
    it('THEN it should return Left of error', () => {
      const currentDate = randomAnyDate();
      const startAndEnd = faker.date.recent({ refDate: currentDate });
      const result = validateDateRange(currentDate, startAndEnd, startAndEnd);

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
  describe('WHEN start timestamp is after end timestamp', () => {
    it('THEN it should return Left of error', () => {
      const currentDate = randomAnyDate();
      const after = faker.date.recent({ refDate: currentDate });
      const before = faker.date.recent({ refDate: after });
      const result = validateDateRange(currentDate, after, before);

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
  describe('WHEN start timestamp is in the future', () => {
    it('THEN it should return Left of error', () => {
      const currentDate = randomAnyDate();
      const { before, after } = randomBeforeAndAfterDate(currentDate);
      const result = validateDateRange(currentDate, before, after);

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
  describe('WHEN end timestamp is in the future', () => {
    it('THEN it should return Left of error', () => {
      const currentDate = randomAnyDate();
      const before = faker.date.recent({ refDate: currentDate });
      const after = faker.date.future({ refDate: currentDate });
      const result = validateDateRange(currentDate, before, after);

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
  describe('WHEN start and end timestamps is valid', () => {
    it('THEN it should return Right of start and end timestamps', () => {
      const currentDate = randomAnyDate();
      const after = faker.date.recent({ refDate: currentDate });
      const before = faker.date.recent({ refDate: after });
      const result = validateDateRange(currentDate, before, after);

      expect(result).toEqualRight({ start: before, end: after });
    });
  });
});

describe('Extend date range by maximun number of klines', () => {
  it('THEN it should return start that is before the input start timestamp', () => {
    const range = {
      start: new Date('2022-04-03 12:00:00'),
      end: new Date('2022-04-03 14:00:00'),
    } as DateRange;
    const timeframe = timeframeEnum['1d'];
    const maxNumKlines = 5 as MaxNumKlines;

    const result = extendDateRangeByMaxNumKlines(range, timeframe, maxNumKlines);
    expect(result.start).toSatisfy(isBefore(range.start));
  });
  it('THEN it should return end equals to the end timestamp', () => {
    const range = {
      start: new Date('2022-04-03 12:00:00'),
      end: new Date('2022-04-03 14:00:00'),
    } as DateRange;
    const timeframe = timeframeEnum['1d'];
    const maxNumKlines = 5 as MaxNumKlines;

    const result = extendDateRangeByMaxNumKlines(range, timeframe, maxNumKlines);
    expect(result.end).toEqual(range.end);
  });

  describe('WHEN timeframe is 1d and maximum number of klines is 5', () => {
    it('THEN it should return start that has difference from the input start timestamp equals to 5 days', () => {
      const range = {
        start: new Date('2022-04-03 12:30:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;
      const timeframe = timeframeEnum['1d'];
      const maxNumKlines = 5 as MaxNumKlines;

      const result = extendDateRangeByMaxNumKlines(range, timeframe, maxNumKlines);
      expect(differenceInDays(range.start, result.start)).toBe(5);
    });
  });
});

describe('Approximate number of API calls', () => {
  describe('WHEN date range does not cover any the end of kline', () => {
    it('THEN it should return 1', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;
      const timeframe = timeframeEnum['1d'];

      expect(approximateNumOfApiCalls(timeframe, range)).toBe(1);
    });
  });
  describe('WHEN date range covers less than 1000 klines', () => {
    it('THEN it should return 1', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;
      const timeframe = timeframeEnum['1m'];

      expect(approximateNumOfApiCalls(timeframe, range)).toBe(1);
    });
  });
  describe('WHEN date range covers more than 1000 but less than 2000 klines', () => {
    it('THEN it should return 2', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-04 14:00:00'),
      } as DateRange;
      const timeframe = timeframeEnum['1m'];

      expect(approximateNumOfApiCalls(timeframe, range)).toBe(2);
    });
  });
});

describe('Calculate number of monthly files', () => {
  describe('WHEN start and end of date range are the same month', () => {
    it('THEN it should return 1', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;

      expect(calculateNumOfMonthlyFiles(range)).toBe(1);
    });
  });
  describe('WHEN date range covers 2 months', () => {
    it('THEN it should return 2', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-05-30 12:00:00'),
      } as DateRange;

      expect(calculateNumOfMonthlyFiles(range)).toBe(2);
    });
  });
});

describe('Calculate number of daily files', () => {
  describe('WHEN start and end of date range are the same day', () => {
    it('THEN it should return 1', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-03 14:00:00'),
      } as DateRange;

      expect(calculateNumOfDailyFiles(range)).toBe(1);
    });
  });
  describe('WHEN date range covers 2 days', () => {
    it('THEN it should return 2', () => {
      const range = {
        start: new Date('2022-04-03 12:00:00'),
        end: new Date('2022-04-04 14:00:00'),
      } as DateRange;

      expect(calculateNumOfDailyFiles(range)).toBe(2);
    });
  });
});
