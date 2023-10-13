import { Schema } from 'mongoose';

import { executeIo } from '#shared/utils/fp.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isBtExecutionDaoError } from './btExecution.error.js';
import { btExecutionModelName, buildBtExecutionDao } from './btExecution.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('UUT: Build backtesting execution DAO', () => {
  const collectionName = 'agenda';

  afterEach(() => deleteModel(client, btExecutionModelName));

  describe('[GIVEN] backtesting execution DAO has not been built', () => {
    describe('[WHEN] build a backtesting execution DAO', () => {
      it('[THEN] it will create mongoose model', () => {
        executeIo(buildBtExecutionDao(client, collectionName));

        expect(client.models).toHaveProperty(btExecutionModelName);
      });
      it('[THEN] it will return Right of backtesting execution DAO', () => {
        const dao = executeIo(buildBtExecutionDao(client, collectionName));

        expect(dao).toEqualRight(expect.toContainKey('composeWith'));
      });
    });
  });

  describe('[GIVEN] backtesting execution DAO has already been built', () => {
    describe('[WHEN] build a backtesting execution DAO', () => {
      it('[THEN] it will return Left of error', () => {
        client.model(btExecutionModelName, new Schema({}));

        const dao = executeIo(buildBtExecutionDao(client, collectionName));

        expect(dao).toEqualLeft(expect.toSatisfy(isBtExecutionDaoError));
      });
    });
  });
});
