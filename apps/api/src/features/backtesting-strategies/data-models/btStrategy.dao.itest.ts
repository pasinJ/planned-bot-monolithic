import { Schema } from 'mongoose';
import { dissoc } from 'ramda';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker.js';
import { mockBtStrategy } from '#test-utils/features/btStrategies/models.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isBtStrategyModelDaoError } from './btStrategy.dao.error.js';
import { BtStrategyMongooseModel, btStrategyModelName, createBtStrategyModelDao } from './btStrategy.dao.js';
import { BtStrategyModelDao } from './btStrategy.dao.type.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('Create backtesting strategy model DAO', () => {
  afterEach(() => deleteModel(client, btStrategyModelName));

  describe('WHEN successfully create a backtesting strategy model DAO', () => {
    it('THEN it should create a model in mongoose client', () => {
      executeIo(createBtStrategyModelDao(client));

      expect(client.models).toHaveProperty(btStrategyModelName);
    });
    it('THEN it should return Right of backtesting strategy model DAO', () => {
      const repository = executeIo(createBtStrategyModelDao(client));
      expect(repository).toEqualRight(expect.toContainAllKeys(['generateId', 'add', 'existById', 'getById']));
    });
  });
  describe('WHEN unsuccessfully create a backtesting strategy model DAO (duplicated model)', () => {
    it('THEN it should return Left of error', () => {
      client.model(btStrategyModelName, new Schema({}));
      const repository = executeIo(createBtStrategyModelDao(client));
      expect(repository).toEqualLeft(expect.toSatisfy(isBtStrategyModelDaoError));
    });
  });
});

describe('Backtesting strategy model Dao', () => {
  let btStrategyModelDao: BtStrategyModelDao;
  let btStrategyModel: BtStrategyMongooseModel;

  beforeAll(() => {
    btStrategyModelDao = unsafeUnwrapEitherRight(executeIo(createBtStrategyModelDao(client)));
    btStrategyModel = client.models[btStrategyModelName];
  });
  afterEach(() => btStrategyModel.deleteMany());
  afterEach(() => deleteModel(client, btStrategyModelName));

  describe('Generate ID', () => {
    it('WHEN generate ID THEN it should return a string with length more than 0', () => {
      const id = btStrategyModelDao.generateId();

      expect(id).toBeString();
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('Add backtesting strategy', () => {
    describe('WHEN successfully add a backtesting strategy', () => {
      it('THEN it should return Right of undefined', async () => {
        const result = await executeT(btStrategyModelDao.add(mockBtStrategy()));

        expect(result).toEqualRight(undefined);
      });
      it('THEN it should insert the backtesting strategy into database', async () => {
        const btStrategy = mockBtStrategy();
        await executeT(btStrategyModelDao.add(btStrategy));

        const findResult = await btStrategyModel.findById(btStrategy.id);
        expect(findResult).not.toBeNull();
        expect(findResult?.toJSON()).toEqual({ ...dissoc('id', btStrategy), _id: btStrategy.id, __v: 0 });
      });
    });
    describe('WHEN try to add a backtesting strategy with existing ID', () => {
      it('THEN it should return Left of error', async () => {
        const btStrategy1 = mockBtStrategy();
        await executeT(btStrategyModelDao.add(btStrategy1));

        const btStrategy2 = mockBtStrategy();
        const result = await executeT(btStrategyModelDao.add({ ...btStrategy2, id: btStrategy1.id }));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyModelDaoError));
      });
    });
  });

  describe('Check existence by ID', () => {
    describe('GIVEN the ID already exists WHEN check existence by ID', () => {
      it('THEN it should return Right of true', async () => {
        const id = randomString();
        const btStrategy = mockBtStrategy({ id });
        await btStrategyModel.create(btStrategy);

        const result = await executeT(btStrategyModelDao.existById(id));

        expect(result).toEqualRight(true);
      });
    });
    describe('GIVEN the ID does not exist WHEN check existence by ID', () => {
      it('THEN it should return Right of false', async () => {
        const result = await executeT(btStrategyModelDao.existById(randomString()));

        expect(result).toEqualRight(false);
      });
    });
  });

  describe('Get by ID', () => {
    describe('GIVEN backtesting strategy with that ID exists WHEN get by ID', () => {
      it('THEN it should return Right of Model', async () => {
        const btStrategy = mockBtStrategy({ version: 0 });
        await btStrategyModel.create(btStrategy);

        const result = await executeT(btStrategyModelDao.getById(btStrategy.id));

        expect(result).toEqualRight(btStrategy);
      });
    });
    describe('GIVEN backtesting strategy with that ID does not exist WHEN get by ID', () => {
      it('THEN it should return Left of error', async () => {
        const result = await executeT(btStrategyModelDao.getById(randomString()));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyModelDaoError));
      });
    });
  });
});
