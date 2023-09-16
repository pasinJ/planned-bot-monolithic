import { Schema } from 'mongoose';

import { executeIo } from '#shared/utils/fp.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isBtStrategyDaoError } from './btStrategy.error.js';
import { btStrategyModelName, buildBtStrategyDao } from './btStrategy.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('Build backtesting strategy model DAO', () => {
  afterEach(() => deleteModel(client, btStrategyModelName));

  describe('WHEN successfully create a backtesting strategy model DAO', () => {
    it('THEN it should create a new mongoose model', () => {
      executeIo(buildBtStrategyDao(client));
      expect(client.models).toHaveProperty(btStrategyModelName);
    });
    it('THEN it should return Right of backtesting strategy DAO', () => {
      const dao = executeIo(buildBtStrategyDao(client));
      expect(dao).toEqualRight(expect.toContainKey('composeWith'));
    });
  });

  describe('WHEN unsuccessfully create a backtesting strategy model DAO (duplicated model)', () => {
    it('THEN it should return Left of error', () => {
      client.model(btStrategyModelName, new Schema({}));
      const repository = executeIo(buildBtStrategyDao(client));
      expect(repository).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
    });
  });
});
