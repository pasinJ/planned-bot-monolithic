import { Schema } from 'mongoose';

import { executeIo } from '#shared/utils/fp.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isBtStrategyDaoError } from './btStrategy.error.js';
import { btStrategyModelName, buildBtStrategyDao } from './btStrategy.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('UUT: Build backtesting strategy DAO', () => {
  afterEach(() => deleteModel(client, btStrategyModelName));

  describe('[GIVEN] backtesting strategy DAO has not been built', () => {
    describe('[WHEN] build a backtesting strategy DAO', () => {
      it('[THEN] it will create mongoose model', () => {
        executeIo(buildBtStrategyDao(client));

        expect(client.models).toHaveProperty(btStrategyModelName);
      });
      it('[THEN] it will return Right of backtesting strategy DAO', () => {
        const dao = executeIo(buildBtStrategyDao(client));

        expect(dao).toEqualRight(expect.toContainKey('composeWith'));
      });
    });
  });

  describe('[GIVEN] backtesting strategy DAO has already been built', () => {
    describe('[WHEN] build a backtesting strategy DAO', () => {
      it('[THEN] it will return Left of error', () => {
        client.model(btStrategyModelName, new Schema({}));

        const dao = executeIo(buildBtStrategyDao(client));

        expect(dao).toEqualLeft(expect.toSatisfy(isBtStrategyDaoError));
      });
    });
  });
});
