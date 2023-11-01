import te from 'fp-ts/lib/TaskEither.js';

import { ExchangeName, exchangeNameEnum } from '#features/shared/exchange.js';
import { SymbolName } from '#features/shared/symbol.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { mockKline } from '#test-utils/features/shared/kline.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import {
  addKlines,
  getFirstKlineBefore,
  getKlinesBefore,
  getLastKlineBefore,
  iterateThroughKlines,
} from './kline.feature.js';
import { KlineMongooseModel, buildKlineDao, klineModelName } from './kline.js';

const client = await createMongoClient();
const klineDao = unsafeUnwrapEitherRight(executeIo(buildKlineDao(client)));
const klineModel: KlineMongooseModel = client.models[klineModelName];

afterEach(() => klineModel.deleteMany());
afterAll(() => client.disconnect());

describe('UUT: Add kline', () => {
  const addFn = klineDao.composeWith(addKlines);

  describe('[GIVEN] the combination of exchange, symbol, timeframe, and close timestamp does not exist', () => {
    const kline = mockKline();

    describe('[WHEN] add a kline', () => {
      it('[THEN] it will insert the kline into database', async () => {
        await executeT(addFn(kline));

        const findResult = await klineModel.find({ symbol: kline.symbol });
        expect(findResult).not.toBeNull();
      });
      it('[THEN] it will return Right of undefined', async () => {
        const result = await executeT(addFn(kline));

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] all klines in the input list do not have existing combination of exchange, symbol, timeframe, and close timestamp', () => {
    const klines = [
      mockKline({ symbol: 'BNBUSDT' }),
      mockKline({ symbol: 'BTCUSDT' }),
      mockKline({ symbol: 'ADAUSDT' }),
    ];

    describe('[WHEN] add those klines', () => {
      it('[THEN] it will insert those klines into database', async () => {
        await executeT(addFn(klines));

        const findResult = await klineModel.find({ symbol: { $in: ['BNBUSDT', 'BTCUSDT', 'ADAUSDT'] } });
        expect(findResult).toHaveLength(klines.length);
      });
      it('[THEN] it will return Right of undefined', async () => {
        const result = await executeT(addFn(klines));

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] some klines in the input list have existing combination of exchange, symbol, timeframe, and close timestamp', () => {
    const existingKline = mockKline({ symbol: 'BNBUSDT' });
    const klines = [existingKline, mockKline({ symbol: 'BTCUSDT' }), mockKline({ symbol: 'ADAUSDT' })];

    describe('[WHEN] add those klines', () => {
      it('[THEN] it will skip those existing klines', async () => {
        await klineModel.create(existingKline);

        await executeT(addFn(klines));

        const findResult = await klineModel.find({ symbol: { $in: ['BNBUSDT', 'BTCUSDT', 'ADAUSDT'] } });
        expect(findResult).toHaveLength(klines.length);
      });
      it('[THEN] it will still return Right of undefined', async () => {
        await klineModel.create(existingKline);

        const result = await executeT(addFn(klines));

        expect(result).toEqualRight(undefined);
      });
    });
  });
});

describe('UUT: Iterate through klines', () => {
  const iterateKlinesFn = klineDao.composeWith(iterateThroughKlines);

  describe('[WHEN] iterate through klines', () => {
    it('[THEN] it will return Right of undefined', () => {
      const result = executeIo(iterateKlinesFn({}));

      expect(result).toEqualRight(undefined);
    });
  });

  describe('[GIVEN] there is no matching kline', () => {
    describe('[WHEN] iterate through klines', () => {
      it('[THEN] it will call onFinish function without calling onEach function', async () => {
        const onEach = jest.fn();
        const onFinish = jest.fn();
        const filter = {};

        await new Promise((resolve) => {
          executeIo(
            iterateKlinesFn(filter, {
              onEach,
              onFinish: onFinish.mockImplementation(() => resolve(undefined)),
            }),
          );
        });

        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(onEach).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('[GIVEN] there are some matching klines', () => {
    const klines = [
      mockKline({ symbol: 'BNBUSDT', closeTimestamp: new Date('2021-10-10') }),
      mockKline({ symbol: 'BTCUSDT', closeTimestamp: new Date('2021-10-11') }),
      mockKline({ symbol: 'ADAUSDT', closeTimestamp: new Date('2021-10-12') }),
    ];

    describe('[WHEN] iterate through klines', () => {
      it('[THEN] it will call onEach function for each kline before it call onFinish function', async () => {
        await klineModel.insertMany(klines);

        const onEach = jest.fn().mockReturnValue(te.right(undefined));
        const onFinish = jest.fn();
        const filter = {};

        await new Promise((resolve) => {
          executeIo(
            iterateKlinesFn(filter, {
              onEach,
              onFinish: onFinish.mockImplementation(() => resolve(undefined)),
            }),
          );
        });

        expect(onEach).toHaveBeenCalledTimes(3);
        klines.map((kline) => expect(onEach).toHaveBeenCalledWith(kline));
        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(onFinish).toHaveBeenCalledAfter(onEach);
      });
      it('[THEN] it will call onEach function with klines in ascending order of close timestamp', async () => {
        await klineModel.insertMany(klines);

        const onEach = jest.fn().mockReturnValue(te.right(undefined));
        const filter = {};

        await new Promise((resolve) => {
          executeIo(iterateKlinesFn(filter, { onEach, onFinish: () => resolve(undefined) }));
        });

        klines.map((kline, index) => expect(onEach).toHaveBeenNthCalledWith(index + 1, kline));
      });
    });
  });

  describe('[GIVEN] there are some matching klines [AND] on the second time of calling onEach function it will return Left', () => {
    const klines = [
      mockKline({ symbol: 'BNBUSDT', closeTimestamp: new Date('2021-10-10') }),
      mockKline({ symbol: 'BTCUSDT', closeTimestamp: new Date('2021-10-11') }),
      mockKline({ symbol: 'ADAUSDT', closeTimestamp: new Date('2021-10-12') }),
    ];

    describe('[WHEN] iterate through klines', () => {
      it('[THEN] it will call onEach function only 2 times [AND] call onError function with the returned Left from the second onEach function calling', async () => {
        await klineModel.insertMany(klines);

        const error = createGeneralError('Any', 'Mock');
        const onEach = jest
          .fn()
          .mockReturnValueOnce(te.right(undefined))
          .mockReturnValueOnce(te.left(error))
          .mockReturnValueOnce(te.right(undefined));
        const onFinish = jest.fn();
        const onError = jest.fn();
        const filter = {};

        await new Promise((resolve) => {
          executeIo(
            iterateKlinesFn(filter, {
              onEach,
              onFinish: onFinish.mockImplementation(() => resolve(undefined)),
              onError: onError.mockImplementation(() => resolve(undefined)),
            }),
          );
        });

        expect(onEach).toHaveBeenCalledTimes(2);
        expect(onError).toHaveBeenCalledExactlyOnceWith(error);
        expect(onError).toHaveBeenCalledAfter(onEach);
        expect(onFinish).not.toHaveBeenCalled();
      });
    });
  });

  describe('[WHEN] iterate through klines with specific exchange filter', () => {
    it('[THEN] it will call onEach function with only klines of the given exchange', async () => {
      const kline = mockKline({ exchange: exchangeNameEnum.BINANCE });
      await klineModel.create(kline);

      const filter = { exchange: 'random' as ExchangeName };
      const onEach = jest.fn().mockReturnValue(te.right(undefined));

      await new Promise((resolve) => {
        executeIo(iterateKlinesFn(filter, { onEach, onFinish: () => resolve(undefined) }));
      });

      expect(onEach).not.toHaveBeenCalled();
    });
  });

  describe('[WHEN] iterate through klines with specific symbol filter', () => {
    it('[THEN] it will call onEach function with only klines of the given symbol', async () => {
      const bnbKline = mockKline({ symbol: 'BNBUSDT' });
      const klines = [bnbKline, mockKline({ symbol: 'BTCUSDT' }), mockKline({ symbol: 'ADAUSDT' })];
      await klineModel.insertMany(klines);

      const filter = { symbol: 'BNBUSDT' as SymbolName };
      const onEach = jest.fn().mockReturnValue(te.right(undefined));

      await new Promise((resolve) => {
        executeIo(iterateKlinesFn(filter, { onEach, onFinish: () => resolve(undefined) }));
      });

      expect(onEach).toHaveBeenCalledExactlyOnceWith(bnbKline);
    });
  });

  describe('[WHEN] iterate through klines with specific timeframe filter', () => {
    it('[THEN] it will call onEach function with only klines of the given timeframe', async () => {
      const dayKline = mockKline({ symbol: 'BNBUSDT', timeframe: '1d' });
      const klines = [
        dayKline,
        mockKline({ symbol: 'BTCUSDT', timeframe: '1m' }),
        mockKline({ symbol: 'ADAUSDT', timeframe: '15m' }),
      ];
      await klineModel.insertMany(klines);

      const filter = { timeframe: timeframeEnum['1d'] };
      const onEach = jest.fn().mockReturnValue(te.right(undefined));

      await new Promise((resolve) => {
        executeIo(iterateKlinesFn(filter, { onEach, onFinish: () => resolve(undefined) }));
      });

      expect(onEach).toHaveBeenCalledWith(dayKline);
    });
  });

  describe('[WHEN] iterate through klines with specific start and end range filter', () => {
    it('[THEN] it will call onEach function with only klines within the given range', async () => {
      const matchKline = mockKline({
        symbol: 'BNBUSDT',
        openTimestamp: new Date('2000-10-10'),
        closeTimestamp: new Date('2000-10-11'),
      });
      const klines = [
        matchKline,
        mockKline({
          symbol: 'BTCUSDT',
          openTimestamp: new Date('2001-01-03'),
          closeTimestamp: new Date('2001-01-10'),
        }),
        mockKline({
          symbol: 'ADAUSDT',
          openTimestamp: new Date('2002-02-03'),
          closeTimestamp: new Date('2002-02-06'),
        }),
      ];
      await klineModel.insertMany(klines);

      const filter = { start: new Date('2000-10-01') as ValidDate, end: new Date('2000-10-15') as ValidDate };
      const onEach = jest.fn().mockReturnValue(te.right(undefined));

      await new Promise((resolve) => {
        executeIo(iterateKlinesFn(filter, { onEach, onFinish: () => resolve(undefined) }));
      });

      expect(onEach).toHaveBeenCalledExactlyOnceWith(matchKline);
    });
  });
});

describe('UUT: Get klines before the specific date', () => {
  const exchange = exchangeNameEnum.BINANCE;
  const symbol = 'BNBUSDT' as SymbolName;
  const timeframe = timeframeEnum['1d'];
  const base = { exchange, symbol, timeframe };
  const kline1 = mockKline({ ...base, closeTimestamp: new Date('2021-10-01T23:59:59.999Z') });
  const kline2 = mockKline({ ...base, closeTimestamp: new Date('2021-10-02T23:59:59.999Z') });
  const kline3 = mockKline({ ...base, closeTimestamp: new Date('2021-10-03T23:59:59.999Z') });
  const kline4 = mockKline({ ...base, closeTimestamp: new Date('2021-10-04T23:59:59.999Z') });

  const getBeforeFn = klineDao.composeWith(getKlinesBefore);

  describe('[GIVEN] there are klines before the specific date more than limit', () => {
    describe('[WHEN] get klines before the specific date', () => {
      it('[THEN] it will return Right of limit number of klines in ascending order', async () => {
        const klines = [kline1, kline2, kline3, kline4];
        await klineModel.insertMany(klines);

        const filter = { ...base, start: new Date('2021-10-04T06:00:00.000Z') as ValidDate };
        const limit = 2;

        const result = await executeT(getBeforeFn(filter, limit));

        expect(result).toEqualRight([kline2, kline3]);
      });
    });
  });

  describe('[GIVEN] there are klines before the specific date less than limit', () => {
    describe('[WHEN] get klines before the specific date', () => {
      it('[THEN] it will return Right of all klines in ascending order', async () => {
        const klines = [kline1, kline2, kline3, kline4];
        await klineModel.insertMany(klines);

        const filter = { ...base, start: new Date('2021-10-04T06:00:00.000Z') as ValidDate };
        const limit = 5;

        const result = await executeT(getBeforeFn(filter, limit));

        expect(result).toEqualRight([kline1, kline2, kline3]);
      });
    });
  });
});

describe('UUT: Get first kline before the specific date', () => {
  const exchange = exchangeNameEnum.BINANCE;
  const symbol = 'BNBUSDT' as SymbolName;
  const timeframe = timeframeEnum['1d'];
  const base = { exchange, symbol, timeframe };
  const kline1 = mockKline({ ...base, closeTimestamp: new Date('2021-10-01T23:59:59.999Z') });
  const kline2 = mockKline({ ...base, closeTimestamp: new Date('2021-10-02T23:59:59.999Z') });
  const kline3 = mockKline({ ...base, closeTimestamp: new Date('2021-10-03T23:59:59.999Z') });
  const kline4 = mockKline({ ...base, closeTimestamp: new Date('2021-10-04T23:59:59.999Z') });

  const getFirstBeforeFn = klineDao.composeWith(getFirstKlineBefore);

  describe('[GIVEN] there are klines before the specific date', () => {
    describe('[WHEN] get first kline before the specific date', () => {
      it('[THEN] it will return Right of the first kline before the specific date', async () => {
        const klines = [kline1, kline2, kline3, kline4];
        await klineModel.insertMany(klines);

        const filter = { ...base, start: new Date('2021-10-04T00:00:00.000Z') as ValidDate };

        const result = await executeT(getFirstBeforeFn(filter));

        expect(result).toEqualRight(kline1);
      });
    });
  });

  describe('[GIVEN] there is no kline before the specific date', () => {
    describe('[WHEN] get first kline before the specific date', () => {
      it('[THEN] it will return Right of null', async () => {
        const klines = [kline1, kline2, kline3, kline4];
        await klineModel.insertMany(klines);

        const filter = { ...base, start: new Date('2021-10-01T00:00:00.000Z') as ValidDate };

        const result = await executeT(getFirstBeforeFn(filter));

        expect(result).toEqualRight(null);
      });
    });
  });
});

describe('UUT: Get last kline before the specific date', () => {
  const exchange = exchangeNameEnum.BINANCE;
  const symbol = 'BNBUSDT' as SymbolName;
  const timeframe = timeframeEnum['1d'];
  const base = { exchange, symbol, timeframe };
  const kline1 = mockKline({ ...base, closeTimestamp: new Date('2021-10-01T23:59:59.999Z') });
  const kline2 = mockKline({ ...base, closeTimestamp: new Date('2021-10-02T23:59:59.999Z') });
  const kline3 = mockKline({ ...base, closeTimestamp: new Date('2021-10-03T23:59:59.999Z') });
  const kline4 = mockKline({ ...base, closeTimestamp: new Date('2021-10-04T23:59:59.999Z') });

  const getLastBeforeFn = klineDao.composeWith(getLastKlineBefore);

  describe('[GIVEN] there are klines before the specific date', () => {
    describe('[WHEN] get last kline before the specific date', () => {
      it('[THEN] it will return Right of the last kline before the specific date', async () => {
        const klines = [kline1, kline2, kline3, kline4];
        await klineModel.insertMany(klines);

        const filter = { ...base, start: new Date('2021-10-04T00:00:00.000Z') as ValidDate };

        const result = await executeT(getLastBeforeFn(filter));

        expect(result).toEqualRight(kline3);
      });
    });
  });

  describe('[GIVEN] there is no kline before the specific date', () => {
    describe('[WHEN] get last kline before the specific date', () => {
      it('[THEN] it will return Right of null', async () => {
        const klines = [kline1, kline2, kline3, kline4];
        await klineModel.insertMany(klines);

        const filter = { ...base, start: new Date('2021-10-01T00:00:00.000Z') as ValidDate };

        const result = await executeT(getLastBeforeFn(filter));

        expect(result).toEqualRight(null);
      });
    });
  });
});
