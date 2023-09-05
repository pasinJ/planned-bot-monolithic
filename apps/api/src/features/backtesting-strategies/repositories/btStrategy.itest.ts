import { Schema } from 'mongoose';
import { dissoc } from 'ramda';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { mockBtStrategy } from '#test-utils/features/btStrategies/entities.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isBtStrategyRepoError } from './btStrategy.error.js';
import { createBtStrategyRepo } from './btStrategy.js';
import { BtStrategyModel, btStrategyModelName } from './btStrategy.model.js';
import { BtStrategyRepo } from './btStrategy.type.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('Create backtesting strategy repository', () => {
  afterEach(() => deleteModel(client, btStrategyModelName));

  describe('WHEN successfully create a backtesting strategy repository', () => {
    it('THEN it should create a model in mongoose client', () => {
      executeIo(createBtStrategyRepo(client));

      expect(client.models).toHaveProperty(btStrategyModelName);
    });
    it('THEN it should return Right of backtesting strategy repository', () => {
      const repository = executeIo(createBtStrategyRepo(client));
      expect(repository).toEqualRight(expect.toContainAllKeys(['add']));
    });
  });
  describe('WHEN unsuccessfully create a backtesting strategy repository (duplicated model)', () => {
    it('THEN it should return Left of error', () => {
      client.model(btStrategyModelName, new Schema({}));
      const repository = executeIo(createBtStrategyRepo(client));
      expect(repository).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
    });
  });
});

describe('Add backtesting strategy', () => {
  let btStrategyRepo: BtStrategyRepo;
  let btStrategyModel: BtStrategyModel;

  function setupRepo() {
    btStrategyRepo = unsafeUnwrapEitherRight(executeIo(createBtStrategyRepo(client)));
    btStrategyModel = client.models[btStrategyModelName];
  }

  beforeAll(() => setupRepo());
  afterEach(() => btStrategyModel.deleteMany());
  afterAll(() => deleteModel(client, btStrategyModelName));

  describe('WHEN successfully add a backtesting strategy', () => {
    it('THEN it should return Right of undefined', async () => {
      const result = await executeT(btStrategyRepo.add(mockBtStrategy()));

      expect(result).toEqualRight(undefined);
    });
    it('THEN it should insert the backtesting strategy into database', async () => {
      const btStrategy = mockBtStrategy();
      await executeT(btStrategyRepo.add(btStrategy));

      const findResult = await btStrategyModel.findById(btStrategy.id);
      expect(findResult).not.toBeNull();
      expect(findResult?.toJSON()).toEqual({ ...dissoc('id', btStrategy), _id: btStrategy.id, __v: 0 });
    });
  });
  describe('WHEN try to add a backtesting strategy with existing id', () => {
    it('THEN it should return Left of error', async () => {
      const btStrategy1 = mockBtStrategy();
      await executeT(btStrategyRepo.add(btStrategy1));

      const btStrategy2 = mockBtStrategy();
      const result = await executeT(btStrategyRepo.add({ ...btStrategy2, id: btStrategy1.id }));

      expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
    });
  });
});
