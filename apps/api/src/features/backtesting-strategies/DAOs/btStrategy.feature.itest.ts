import { dissoc } from 'ramda';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker.js';
import { mockBtStrategy } from '#test-utils/features/btStrategies/models.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { isBtStrategyDaoError } from './btStrategy.error.js';
import {
  addBtStrategyModel,
  existBtStrategyModelById,
  generateBtStrategyModelId,
  getBtStrategyModelById,
} from './btStrategy.feature.js';
import { BtStrategyMongooseModel, btStrategyModelName, buildBtStrategyDao } from './btStrategy.js';

const client = await createMongoClient();
const btStrategyDao = unsafeUnwrapEitherRight(executeIo(buildBtStrategyDao(client)));
const btStrategyModel: BtStrategyMongooseModel = client.models[btStrategyModelName];

afterEach(() => btStrategyModel.deleteMany());
afterAll(() => client.disconnect());

describe('Generate backtesting strategy model ID', () => {
  it('WHEN generate ID THEN it should return a string with length more than 0', () => {
    const id = generateBtStrategyModelId();

    expect(id).toBeString();
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('Add backtesting strategy model', () => {
  const addFn = btStrategyDao.composeWith(addBtStrategyModel);

  describe('WHEN successfully add a backtesting strategy', () => {
    it('THEN it should return Right of undefined', async () => {
      const result = await executeT(addFn(mockBtStrategy()));

      expect(result).toEqualRight(undefined);
    });
    it('THEN it should insert the backtesting strategy into database', async () => {
      const btStrategy = mockBtStrategy();
      await executeT(addFn(btStrategy));

      const findResult = await btStrategyModel.findById(btStrategy.id);
      expect(findResult).not.toBeNull();
      expect(findResult?.toJSON()).toEqual({ ...dissoc('id', btStrategy), _id: btStrategy.id, __v: 0 });
    });
  });

  describe('WHEN try to add a backtesting strategy with existing ID', () => {
    it('THEN it should return Left of error', async () => {
      const btStrategy1 = mockBtStrategy();
      await executeT(addFn(btStrategy1));

      const btStrategy2 = mockBtStrategy({ id: btStrategy1.id });
      const result = await executeT(addFn(btStrategy2));

      expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
    });
  });
});

describe('Check existence of backtesting strategy model by ID', () => {
  const existFn = btStrategyDao.composeWith(existBtStrategyModelById);

  describe('GIVEN the ID already exists WHEN check existence by ID', () => {
    it('THEN it should return Right of true', async () => {
      const id = randomString();
      const btStrategy = mockBtStrategy({ id });
      await btStrategyModel.create(btStrategy);

      const result = await executeT(existFn(id));

      expect(result).toEqualRight(true);
    });
  });
  describe('GIVEN the ID does not exist WHEN check existence by ID', () => {
    it('THEN it should return Right of false', async () => {
      const result = await executeT(existFn(randomString()));

      expect(result).toEqualRight(false);
    });
  });
});

describe('Get backtesting strategy model by ID', () => {
  const getFn = btStrategyDao.composeWith(getBtStrategyModelById);

  describe('GIVEN backtesting strategy with the ID exists WHEN get by ID', () => {
    it('THEN it should return Right of Model', async () => {
      const btStrategy = mockBtStrategy({ version: 0 });
      await btStrategyModel.create(btStrategy);

      const result = await executeT(getFn(btStrategy.id));

      expect(result).toEqualRight(btStrategy);
    });
  });
  describe('GIVEN backtesting strategy with that ID does not exist WHEN get by ID', () => {
    it('THEN it should return Left of error', async () => {
      const result = await executeT(getFn(randomString()));

      expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
    });
  });
});
