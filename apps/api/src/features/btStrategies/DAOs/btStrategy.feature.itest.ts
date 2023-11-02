import { dissoc } from 'ramda';

import { InitialCapital } from '#SECT/Strategy.js';
import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { mockBtStrategyModel } from '#test-utils/features/btStrategies/btStrategy.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { isBtStrategyDaoError } from './btStrategy.error.js';
import {
  addBtStrategyModel,
  existBtStrategyModelById,
  getBtStrategyModelById,
  updateBtStrategyById,
} from './btStrategy.feature.js';
import { BtStrategyMongooseModel, btStrategyModelName, buildBtStrategyDao } from './btStrategy.js';

const client = await createMongoClient();
const btStrategyDao = unsafeUnwrapEitherRight(executeIo(buildBtStrategyDao(client)));
const btStrategyModel: BtStrategyMongooseModel = client.models[btStrategyModelName];

afterEach(() => btStrategyModel.deleteMany());
afterAll(() => client.disconnect());

describe('UUT: Add backtesting strategy model', () => {
  const addFn = btStrategyDao.composeWith(addBtStrategyModel);

  describe('[GIVEN] the ID has not been used', () => {
    const btStrategy = mockBtStrategyModel();

    describe('[WHEN] add a backtesting strategy', () => {
      it('[THEN] it will insert the backtesting strategy into database', async () => {
        await executeT(addFn(btStrategy));

        const findResult = await btStrategyModel.findById(btStrategy.id);
        expect(findResult).not.toBeNull();
        expect(findResult?.toJSON()).toEqual(expect.objectContaining(dissoc('id', btStrategy)));
      });
      it('[THEN] it will return Right of undefined', async () => {
        const result = await executeT(addFn(btStrategy));

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] the ID has been used', () => {
    describe('[WHEN] add a backtesting strategy', () => {
      it('[THEN] it will return Left of error', async () => {
        const btStrategy1 = mockBtStrategyModel();
        const btStrategy2 = mockBtStrategyModel({ id: btStrategy1.id });
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
        const btStrategy = mockBtStrategyModel({ id: 'uK65SxBWwA' });
        await btStrategyModel.create(btStrategy);

        const result = await executeT(existFn(btStrategy.id));

        expect(result).toEqualRight(true);
      });
    });
  });

  describe('[GIVEN] the ID does not exist', () => {
    describe('[WHEN] check existence by ID', () => {
      it('[THEN] it will return Right of false', async () => {
        const id = '2gMnmAy4t7';

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
        const btStrategy = mockBtStrategyModel();
        await btStrategyModel.create(btStrategy);

        const result = await executeT(getFn(btStrategy.id));

        expect(result).toEqualRight(btStrategy);
      });
    });
  });

  describe('[GIVEN] no backtesting strategy with that ID exists', () => {
    describe('[WHEN] get by ID', () => {
      it('[THEN] it will return Left of error', async () => {
        const id = 'q_FNBhk8dy';

        const result = await executeT(getFn(id));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
      });
    });
  });
});

describe('UUT: Update backtesting strategy by ID', () => {
  const updateByIdFn = btStrategyDao.composeWith(updateBtStrategyById);

  describe('[GIVEN] the ID does not exist', () => {
    describe('[WHEN] update backtesting strategy by ID', () => {
      it('[THEN] it will return Left of error', async () => {
        const btStrategy = mockBtStrategyModel();

        const result = await executeT(updateByIdFn(btStrategy.id, btStrategy));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
      });
    });
  });

  describe('[GIVEN] the ID exists', () => {
    const btStrategy = mockBtStrategyModel({ initialCapital: 1000 });
    const updateTo = { initialCapital: 500 as InitialCapital };

    describe('[WHEN] update backtesting strategy by ID', () => {
      it('[THEN] it will return Right of undefined', async () => {
        await btStrategyModel.create(btStrategy);

        const result = await executeT(updateByIdFn(btStrategy.id, updateTo));

        expect(result).toEqualRight(undefined);
      });
      it('[THEN] it will update backtesting strategy in database', async () => {
        await btStrategyModel.create(btStrategy);

        await executeT(updateByIdFn(btStrategy.id, updateTo));

        const updatedBtStratgy = await btStrategyModel.findById(btStrategy.id);
        expect(updatedBtStratgy).toEqual(expect.objectContaining(updateTo));
      });
    });
  });
});
