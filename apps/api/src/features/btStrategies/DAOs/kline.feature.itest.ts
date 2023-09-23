import { faker } from '@faker-js/faker';
import { addSeconds, subSeconds } from 'date-fns';
import te from 'fp-ts/lib/TaskEither.js';
import { descend, prop, propEq, reverse, sort } from 'ramda';

import { ExchangeName } from '#features/shared/domain/exchange.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { randomString } from '#test-utils/faker/string.js';
import { mockKline } from '#test-utils/features/btStrategies/models.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { addKlineModels, iterateThroughKlineModels } from './kline.feature.js';
import { KlineMongooseModel, buildKlineDao, klineModelName } from './kline.js';

const client = await createMongoClient();
const klineDao = unsafeUnwrapEitherRight(executeIo(buildKlineDao(client)));
const klineModel: KlineMongooseModel = client.models[klineModelName];

afterEach(() => klineModel.deleteMany());
afterAll(() => client.disconnect());

describe('UUT: Add kline models', () => {
  const addFn = klineDao.composeWith(addKlineModels);

  describe('[WHEN] add a kline model with not existing combination of exchange, symbol, timeframe, and close timestamp', () => {
    it('[THEN] it will insert the symbol into database', async () => {
      const kline = mockKline();

      await executeT(addFn(kline));

      const findResult = await klineModel.find({ symbol: kline.symbol });
      expect(findResult).not.toBeNull();
    });
    it('[THEN] it will return Right of undefined', async () => {
      const kline = mockKline();

      const result = await executeT(addFn(kline));

      expect(result).toEqualRight(undefined);
    });
  });

  describe('[WHEN] add multiple klines with not existing combination of exchange, symbol, timeframe, and close timestamp', () => {
    it('[THEN] it will insert those klines into database', async () => {
      const klines = generateArrayOf(mockKline);

      await executeT(addFn(klines));

      const findResult = await klineModel.find({ symbol: { $in: klines.map(prop('symbol')) } });
      expect(findResult).toHaveLength(klines.length);
    });
    it('[THEN] it will return Right of undefined', async () => {
      const klines = generateArrayOf(mockKline);

      const result = await executeT(addFn(klines));

      expect(result).toEqualRight(undefined);
    });
  });

  describe('[WHEN] add multiple klines with some klines have existing combination of exchange, symbol, timeframe, and close timestamp', () => {
    it('[THEN] it will skip those existing klines', async () => {
      const klines = generateArrayOf(mockKline, 5);
      const existingKline = faker.helpers.arrayElements(klines);
      await klineModel.insertMany(existingKline);

      await executeT(addFn(klines));

      const findResult = await klineModel.find({ symbol: { $in: klines.map(prop('symbol')) } });
      expect(findResult).toHaveLength(klines.length);
    });
    it('[THEN] it will still return Right of undefined', async () => {
      const klines = generateArrayOf(mockKline, 5);
      const existingKline = faker.helpers.arrayElements(klines);
      await klineModel.insertMany(existingKline);

      const result = await executeT(addFn(klines));

      expect(result).toEqualRight(undefined);
    });
  });
});

describe('UUT: Iterate through kline models', () => {
  const iterateKlinesFn = klineDao.composeWith(iterateThroughKlineModels);

  describe('[WHEN] iterate through klines', () => {
    it('[THEN] it will return Right of undefined', () => {
      const result = executeIo(iterateKlinesFn({}));

      expect(result).toEqualRight(undefined);
    });
  });

  describe('[GIVEN] there is no matching kline model', () => {
    describe('[WHEN] iterate through klines', () => {
      it('[THEN] it will call onFinish function without calling onEach function', async () => {
        const onEach = jest.fn();
        const onFinish = jest.fn();

        await new Promise((resolve) => {
          executeIo(
            iterateKlinesFn({}, { onEach, onFinish: onFinish.mockImplementation(() => resolve(undefined)) }),
          );
        });

        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(onEach).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('[GIVEN] there are some matching klines', () => {
    describe('[WHEN] iterate through klines', () => {
      it('[THEN] it will call onEach function for each kline before it call onFinish function', async () => {
        const klines = generateArrayOf(mockKline, 3);
        const descKlines = sort(descend(prop('closeTimestamp')), klines);
        await klineModel.insertMany(descKlines);

        const onEach = jest.fn().mockReturnValue(te.right(undefined));
        const onFinish = jest.fn();

        await new Promise((resolve) => {
          executeIo(
            iterateKlinesFn({}, { onEach, onFinish: onFinish.mockImplementation(() => resolve(undefined)) }),
          );
        });

        expect(onEach).toHaveBeenCalledTimes(3);
        klines.map((kline) => expect(onEach).toHaveBeenCalledWith(kline));
        expect(onFinish).toHaveBeenCalledTimes(1);
        expect(onFinish).toHaveBeenCalledAfter(onEach);
      });
      it('[THEN] it will call onEach function with klines in ascending order of close timestamp', async () => {
        const klines = generateArrayOf(mockKline, 3);
        const descKlines = sort(descend(prop('closeTimestamp')), klines);
        await klineModel.insertMany(descKlines);

        const onEach = jest.fn().mockReturnValue(te.right(undefined));

        await new Promise((resolve) => {
          executeIo(iterateKlinesFn({}, { onEach, onFinish: () => resolve(undefined) }));
        });

        reverse(descKlines).map((kline, index) => expect(onEach).toHaveBeenNthCalledWith(index + 1, kline));
      });
    });

    describe('[WHEN] iterate through klines [AND] on the second time of calling onEach function it return Left', () => {
      it('[THEN] it will call onEach function only 2 times [AND] call onError function with the returned Left from the second onEach function calling', async () => {
        const klines = generateArrayOf(mockKline, 3);
        await klineModel.insertMany(klines);

        const error = createGeneralError('Any', 'Mock');
        const onEach = jest
          .fn()
          .mockReturnValueOnce(te.right(undefined))
          .mockReturnValueOnce(te.left(error))
          .mockReturnValueOnce(te.right(undefined));
        const onFinish = jest.fn();
        const onError = jest.fn();

        await new Promise((resolve) => {
          executeIo(
            iterateKlinesFn(
              {},
              {
                onEach,
                onFinish: onFinish.mockImplementation(() => resolve(undefined)),
                onError: onError.mockImplementation(() => resolve(undefined)),
              },
            ),
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
      const klines = generateArrayOf(mockKline, 3);
      await klineModel.insertMany(klines);

      const filter = { exchange: randomString() as ExchangeName };
      const onEach = jest.fn().mockReturnValue(te.right(undefined));

      await new Promise((resolve) => {
        executeIo(iterateKlinesFn(filter, { onEach, onFinish: () => resolve(undefined) }));
      });

      expect(onEach).not.toHaveBeenCalled();
    });
  });

  describe('[WHEN] iterate through klines with specific symbol filter', () => {
    it('[THEN] it will call onEach function with only klines of the given symbol', async () => {
      const klines = generateArrayOf(mockKline, 3);
      await klineModel.insertMany(klines);

      const filter = { symbol: klines[0].symbol };
      const onEach = jest.fn().mockReturnValue(te.right(undefined));

      await new Promise((resolve) => {
        executeIo(iterateKlinesFn(filter, { onEach, onFinish: () => resolve(undefined) }));
      });

      expect(onEach).toHaveBeenCalledExactlyOnceWith(klines[0]);
    });
  });

  describe('[WHEN] iterate through klines with specific timeframe filter', () => {
    it('[THEN] it will call onEach function with only klines of the given timeframe', async () => {
      const klines = generateArrayOf(mockKline, 3);
      await klineModel.insertMany(klines);

      const timeframe = klines[0].timeframe;
      const filter = { timeframe };
      const onEach = jest.fn().mockReturnValue(te.right(undefined));

      await new Promise((resolve) => {
        executeIo(iterateKlinesFn(filter, { onEach, onFinish: () => resolve(undefined) }));
      });

      expect(onEach).toHaveBeenCalledTimes(klines.filter(propEq(timeframe, 'timeframe')).length);
    });
  });

  describe('[WHEN] iterate through klines with specific start and end range filter', () => {
    it('[THEN] it will call onEach function with only klines within the given range', async () => {
      const klines = generateArrayOf(mockKline, 3);
      await klineModel.insertMany(klines);

      const closeTimestamp = klines[0].closeTimestamp;
      const filter = {
        start: subSeconds(closeTimestamp, 10) as ValidDate,
        end: addSeconds(closeTimestamp, 10) as ValidDate,
      };
      const onEach = jest.fn().mockReturnValue(te.right(undefined));

      await new Promise((resolve) => {
        executeIo(iterateKlinesFn(filter, { onEach, onFinish: () => resolve(undefined) }));
      });

      expect(onEach).toHaveBeenCalledExactlyOnceWith(klines[0]);
    });
  });
});
