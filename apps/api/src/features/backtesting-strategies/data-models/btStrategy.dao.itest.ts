import { Schema } from 'mongoose';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomString } from '#test-utils/faker.js';
import { mockBtStrategy } from '#test-utils/features/btStrategies/entities.js';
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
      expect(repository).toEqualRight(expect.toContainAllKeys(['existById']));
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

  function setupRepo() {
    btStrategyModelDao = unsafeUnwrapEitherRight(executeIo(createBtStrategyModelDao(client)));
    btStrategyModel = client.models[btStrategyModelName];
  }

  beforeAll(() => setupRepo());
  afterEach(() => btStrategyModel.deleteMany());
  afterEach(() => deleteModel(client, btStrategyModelName));

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
});
