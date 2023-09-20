import { faker } from '@faker-js/faker';
import { addSeconds, subSeconds } from 'date-fns';
import te from 'fp-ts/lib/TaskEither.js';
import { descend, prop, propEq, reverse, sort } from 'ramda';

import { ExchangeName } from '#features/shared/domain/exchangeName.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { generateArrayOf, randomString } from '#test-utils/faker.js';
import { mockKline } from '#test-utils/features/btStrategies/models.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { addKlineModels, iterateKlineModels } from './kline.feature.js';
import { KlineMongooseModel, buildKlineDao, klineModelName } from './kline.js';

const client = await createMongoClient();
const klineDao = unsafeUnwrapEitherRight(executeIo(buildKlineDao(client)));
const klineModel: KlineMongooseModel = client.models[klineModelName];

afterEach(() => klineModel.deleteMany());
afterAll(() => client.disconnect());

describe('Add kline models', () => {
  const addFn = klineDao.composeWith(addKlineModels);

  describe('WHEN successfully add a kline', () => {
    it('THEN it should return Right of undefined', async () => {
      const result = await executeT(addFn(mockKline()));

      expect(result).toEqualRight(undefined);
    });
    it('THEN it should insert the symbol into database', async () => {
      const kline = mockKline();
      await executeT(addFn(kline));

      const findResult = await klineModel.find({ symbol: kline.symbol });
      expect(findResult).not.toBeNull();
    });
  });

  describe('WHEN successfully add multiple klines at the same time', () => {
    it('THEN it should return Right of undefined', async () => {
      const klines = generateArrayOf(mockKline);
      const result = await executeT(addFn(klines));

      expect(result).toEqualRight(undefined);
    });
    it('THEN it should insert those klines into database', async () => {
      const klines = generateArrayOf(mockKline);
      await executeT(addFn(klines));

      const symbolsList = klines.map(prop('symbol'));
      const findResult = await klineModel.find({ symbol: { $in: symbolsList } });
      expect(findResult).toHaveLength(symbolsList.length);
    });
  });

  describe('WHEN there are some klines with existing combination of exchange, symbol, timeframe, closeTimestamp', () => {
    it('THEN it should still return Right of undefined', async () => {
      const klines = generateArrayOf(mockKline);
      const existingKline = faker.helpers.arrayElement(klines);
      await klineModel.create(existingKline);

      const result = await executeT(addFn(klines));

      expect(result).toEqualRight(undefined);
    });
    it('THEN it should skip those klines', async () => {
      const klines = generateArrayOf(mockKline);
      const existingKline = faker.helpers.arrayElement(klines);
      await klineModel.create(existingKline);

      await executeT(addFn(klines));

      const symbolsList = klines.map(prop('symbol'));
      const findResult = await klineModel.find({ symbol: { $in: symbolsList } });
      expect(findResult).toHaveLength(symbolsList.length);
    });
  });
});

describe('Iterate kline models', () => {
  const iterateKlinesFn = klineDao.composeWith(iterateKlineModels);

  describe('WHEN iterate kline models', () => {
    it('THEN it should return Right of undefined', () => {
      const result = executeIo(iterateKlinesFn({}));

      expect(result).toEqualRight(undefined);
    });
  });

  describe('GIVEN there is no matching kline WHEN iterate klines', () => {
    it('THEN it should call onFinish function without call onEach function', async () => {
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

  describe('GIVEN there are 3 matching klines WHEN iterate klines', () => {
    it('THEN it should call onEach function for each kline before call onFinish function', async () => {
      const klines = generateArrayOf(mockKline, 3);
      await klineModel.insertMany(klines);

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
    it('THEN it should call onEach function with kline in ascending order of close timestamp', async () => {
      const klines = generateArrayOf(mockKline, 3);
      const descKlines = sort(descend(prop('closeTimestamp')), klines);
      await klineModel.insertMany(descKlines);

      const dataList: unknown[] = [];
      const onEach = jest.fn().mockImplementation((data) => {
        dataList.push(data);
        return te.right(undefined);
      });
      await new Promise((resolve) => {
        executeIo(iterateKlinesFn({}, { onEach, onFinish: () => resolve(undefined) }));
      });

      expect(dataList).toEqual(reverse(descKlines));
    });
  });

  describe('GIVEN there are 3 matching klines WHEN the second onEach function return Left', () => {
    it('THEN it should call onEach function only 2 times then call onError function with the returned Left from onEach function', async () => {
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

  describe('WHEN iterate klines with specific exchange filter', () => {
    it('THEN it should return only klines with the given exchange', async () => {
      const klines = generateArrayOf(mockKline, 3);
      await klineModel.insertMany(klines);

      const onEach = jest.fn().mockReturnValue(te.right(undefined));
      await new Promise((resolve) => {
        executeIo(
          iterateKlinesFn(
            { exchange: randomString() as ExchangeName },
            { onEach, onFinish: () => resolve(undefined) },
          ),
        );
      });

      expect(onEach).not.toHaveBeenCalled();
    });
  });

  describe('WHEN iterate klines with specific symbol filter', () => {
    it('THEN it should return only klines with the given symbol', async () => {
      const klines = generateArrayOf(mockKline, 3);
      await klineModel.insertMany(klines);

      const onEach = jest.fn().mockReturnValue(te.right(undefined));
      await new Promise((resolve) => {
        executeIo(
          iterateKlinesFn({ symbol: klines[0].symbol }, { onEach, onFinish: () => resolve(undefined) }),
        );
      });

      expect(onEach).toHaveBeenCalledExactlyOnceWith(klines[0]);
    });
  });

  describe('WHEN iterate klines with specific timeframe filter', () => {
    it('THEN it should return only klines with the given timeframe', async () => {
      const klines = generateArrayOf(mockKline, 3);
      await klineModel.insertMany(klines);

      const timeframe = klines[0].timeframe;
      const onEach = jest.fn().mockReturnValue(te.right(undefined));
      await new Promise((resolve) => {
        executeIo(iterateKlinesFn({ timeframe: timeframe }, { onEach, onFinish: () => resolve(undefined) }));
      });

      expect(onEach).toHaveBeenCalledTimes(klines.filter(propEq(timeframe, 'timeframe')).length);
    });
  });

  describe('WHEN iterate klines with specific start and end range filter', () => {
    it('THEN it should return only klines within the given range', async () => {
      const klines = generateArrayOf(mockKline, 3);
      await klineModel.insertMany(klines);

      const closeTimestamp = klines[0].closeTimestamp;
      const onEach = jest.fn().mockReturnValue(te.right(undefined));
      await new Promise((resolve) => {
        executeIo(
          iterateKlinesFn(
            { start: subSeconds(closeTimestamp, 10), end: addSeconds(closeTimestamp, 10) },
            { onEach, onFinish: () => resolve(undefined) },
          ),
        );
      });

      expect(onEach).toHaveBeenCalledExactlyOnceWith(klines[0]);
    });
  });
});
