import io from 'fp-ts/lib/IO.js';
import ior from 'fp-ts/lib/IORef.js';
import te from 'fp-ts/lib/TaskEither.js';

import { createDateRange } from '#features/shared/objectValues/dateRange.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeIo, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { mockLoggerIo } from '#test-utils/services.js';

import { startBtProgressUpdator } from './backtest.js';
import { BtProgressUpdateInterval } from './backtesting.job.config.js';

describe('UUT: Backtesting progress updator', () => {
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());

  describe('[WHEN] interval time pass after start backtesting progress updator', () => {
    it('[THEN] it will call update progress with progress percentage and logs based on given refs', async () => {
      const logs = ['log1', 'log2'];
      const logsRef = new ior.IORef(logs);
      const processingDateRef = new ior.IORef(new Date('2010-01-03') as ValidDate);
      const getConfig = () => ({ PROGRESS_UPDATE_INTERVAL: 1000 as BtProgressUpdateInterval });
      const loggerIo = mockLoggerIo();
      const updateBtProgressFn = jest.fn().mockReturnValue(te.right(undefined));
      const deps = { logsRef, processingDateRef, getConfig, loggerIo, updateBtProgress: updateBtProgressFn };
      const btDateRange = unsafeUnwrapEitherRight(
        createDateRange(new Date('2010-01-01'), new Date('2010-01-11')),
      );

      executeIo(startBtProgressUpdator(deps)(btDateRange));

      expect(updateBtProgressFn).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(1000);

      expect(updateBtProgressFn).toHaveBeenCalledExactlyOnceWith(20, logs);
    });
  });

  describe('[WHEN] start backtesting progress updator then stop the updator', () => {
    it('[THEN] it will not call update progress anymore', async () => {
      const logsRef = new ior.IORef([]);
      const processingDateRef = new ior.IORef(new Date('2010-01-03') as ValidDate);
      const getConfig = () => ({ PROGRESS_UPDATE_INTERVAL: 1000 as BtProgressUpdateInterval });
      const loggerIo = mockLoggerIo();
      const updateBtProgressFn = jest.fn().mockReturnValue(te.right(undefined));
      const deps = { logsRef, processingDateRef, getConfig, loggerIo, updateBtProgress: updateBtProgressFn };
      const btDateRange = unsafeUnwrapEitherRight(
        createDateRange(new Date('2010-01-01'), new Date('2010-01-11')),
      );

      const updator = executeIo(startBtProgressUpdator(deps)(btDateRange));

      await jest.advanceTimersByTimeAsync(1000);

      expect(updateBtProgressFn).toHaveBeenCalled();
      updateBtProgressFn.mockClear();

      updator.stop();

      await jest.advanceTimersByTimeAsync(1000);

      expect(updateBtProgressFn).not.toHaveBeenCalled();
    });
  });

  describe('[GIVEN] update progress function return Left', () => {
    describe('[WHEN] interval time pass after start backtesting progress updator', () => {
      it('[THEN] it will call logger.errorIo', async () => {
        const logsRef = new ior.IORef([]);
        const processingDateRef = new ior.IORef(new Date('2010-01-03') as ValidDate);
        const getConfig = () => ({ PROGRESS_UPDATE_INTERVAL: 1000 as BtProgressUpdateInterval });
        const loggerIo = { ...mockLoggerIo(), errorIo: jest.fn().mockReturnValue(io.of(undefined)) };
        const deps = {
          logsRef,
          processingDateRef,
          getConfig,
          loggerIo,
          updateBtProgress: () => te.left('Error'),
        };
        const btDateRange = unsafeUnwrapEitherRight(
          createDateRange(new Date('2010-01-01'), new Date('2010-01-11')),
        );

        executeIo(startBtProgressUpdator(deps)(btDateRange));

        await jest.advanceTimersByTimeAsync(1000);

        expect(loggerIo.errorIo).toHaveBeenCalledOnce();
      });
    });
  });
});
