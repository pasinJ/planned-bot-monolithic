import { faker } from '@faker-js/faker';
import { prop } from 'ramda';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { generateArrayOf } from '#test-utils/faker.js';
import { mockKline } from '#test-utils/features/btStrategies/models.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { addKlineModels } from './kline.feature.js';
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
