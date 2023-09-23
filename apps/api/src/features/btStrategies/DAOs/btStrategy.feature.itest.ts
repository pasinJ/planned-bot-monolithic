import { dissoc } from 'ramda';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker/string.js';
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

describe('UUT: Generate backtesting strategy model ID', () => {
  describe('[WHEN] generate backtesting strategy model ID', () => {
    it('[THEN] it will return a string with length more than 0', () => {
      const id = generateBtStrategyModelId();

      expect(id).toBeString();
      expect(id.length).toBeGreaterThan(0);
    });
  });
});

describe('UUT: Add backtesting strategy model', () => {
  const addFn = btStrategyDao.composeWith(addBtStrategyModel);

  describe('[GIVEN] the ID has not been used', () => {
    describe('[WHEN] add a backtesting strategy', () => {
      it('[THEN] it will insert the backtesting strategy into database', async () => {
        const btStrategy = mockBtStrategy();

        await executeT(addFn(btStrategy));

        const findResult = await btStrategyModel.findById(btStrategy.id);
        expect(findResult).not.toBeNull();
        expect(findResult?.toJSON()).toEqual({ ...dissoc('id', btStrategy), _id: btStrategy.id, __v: 0 });
      });
      it('[THEN] it will return Right of undefined', async () => {
        const btStrategy = mockBtStrategy();

        const result = await executeT(addFn(btStrategy));

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] the ID has been used', () => {
    describe('[WHEN] add a backtesting strategy', () => {
      it('[THEN] it will return Left of error', async () => {
        const btStrategy1 = mockBtStrategy();
        const btStrategy2 = mockBtStrategy({ id: btStrategy1.id });
        await btStrategyModel.create(btStrategy1);

        const result = await executeT(addFn(btStrategy2));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
      });
    });
  });
});

describe('UUT: Check existence of backtesting strategy model by ID', () => {
  const existFn = btStrategyDao.composeWith(existBtStrategyModelById);

  describe('[GIVEN] the ID already exists', () => {
    describe('[WHEN] check existence by ID', () => {
      it('[THEN] it will return Right of true', async () => {
        const id = randomString();
        const btStrategy = mockBtStrategy({ id });
        await btStrategyModel.create(btStrategy);

        const result = await executeT(existFn(id));

        expect(result).toEqualRight(true);
      });
    });
  });

  describe('[GIVEN] the ID does not exist', () => {
    describe('[WHEN] check existence by ID', () => {
      it('[THEN] it will return Right of false', async () => {
        const id = randomString();

        const result = await executeT(existFn(id));

        expect(result).toEqualRight(false);
      });
    });
  });
});

describe('UUT: Get backtesting strategy model by ID', () => {
  const getFn = btStrategyDao.composeWith(getBtStrategyModelById);

  describe('[GIVEN] a backtesting strategy with the ID exists', () => {
    describe('[WHEN] get by ID', () => {
      it('[THEN] it will return Right of the backtesting strategy', async () => {
        const btStrategy = mockBtStrategy({ version: 0 });
        await btStrategyModel.create(btStrategy);

        const result = await executeT(getFn(btStrategy.id));

        expect(result).toEqualRight(btStrategy);
      });
    });
  });

  describe('[GIVEN] no backtesting strategy with that ID exists', () => {
    describe('[WHEN] get by ID', () => {
      it('[THEN] it will return Left of error', async () => {
        const id = randomString();

        const result = await executeT(getFn(id));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
      });
    });
  });
});
