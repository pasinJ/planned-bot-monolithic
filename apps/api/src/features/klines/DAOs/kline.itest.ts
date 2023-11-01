import { Schema } from 'mongoose';

import { executeIo } from '#shared/utils/fp.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isKlineDaoError } from '../../btStrategies/DAOs/kline.error.js';
import { buildKlineDao, klineModelName } from './kline.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('UUT: Build kline DAO', () => {
  afterEach(() => deleteModel(client, klineModelName));

  describe('[GIVEN] kline DAO has not been built', () => {
    describe('[WHEN] build a kline DAO', () => {
      it('[THEN] it will create mongoose model', () => {
        executeIo(buildKlineDao(client));

        expect(client.models).toHaveProperty(klineModelName);
      });
      it('[THEN] it will return Right of kline DAO', () => {
        const dao = executeIo(buildKlineDao(client));

        expect(dao).toEqualRight(expect.toContainKey('composeWith'));
      });
    });
  });

  describe('[GIVEN] kline DAO has already been built', () => {
    describe('[WHEN] build a kline DAO', () => {
      it('[THEN] it will return Left of error', () => {
        client.model(klineModelName, new Schema({}));

        const dao = executeIo(buildKlineDao(client));

        expect(dao).toEqualLeft(expect.toSatisfy(isKlineDaoError));
      });
    });
  });
});
