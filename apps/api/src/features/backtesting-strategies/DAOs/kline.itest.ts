import { Schema } from 'mongoose';

import { executeIo } from '#shared/utils/fp.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isKlineDaoError } from './kline.error.js';
import { buildKlineDao, klineModelName } from './kline.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('Build kline model DAO', () => {
  afterEach(() => deleteModel(client, klineModelName));

  describe('WHEN successfully create a kline model DAO', () => {
    it('THEN it should create a new mongoose model', () => {
      executeIo(buildKlineDao(client));
      expect(client.models).toHaveProperty(klineModelName);
    });
    it('THEN it should return Right of kline DAO', () => {
      const dao = executeIo(buildKlineDao(client));
      expect(dao).toEqualRight(expect.toContainKey('composeWith'));
    });
  });

  describe('WHEN unsuccessfully create a kline model DAO (duplicated model)', () => {
    it('THEN it should return Left of error', () => {
      client.model(klineModelName, new Schema({}));
      const repository = executeIo(buildKlineDao(client));
      expect(repository).toEqualLeft(expect.toSatisfy(isKlineDaoError));
    });
  });
});
