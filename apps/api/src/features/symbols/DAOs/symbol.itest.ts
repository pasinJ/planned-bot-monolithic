import { Schema } from 'mongoose';

import { executeIo } from '#shared/utils/fp.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isSymbolDaoError } from './symbol.error.js';
import { buildSymbolDao, symbolModelName } from './symbol.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('Build symbol DAO', () => {
  afterEach(() => deleteModel(client, symbolModelName));

  describe('WHEN successfully build symbol DAO', () => {
    it('THEN it should create a new mongoose model', () => {
      executeIo(buildSymbolDao(client));
      expect(client.models).toHaveProperty(symbolModelName);
    });
    it('THEN it should return Right of symbol DAO', () => {
      const dao = executeIo(buildSymbolDao(client));
      expect(dao).toEqualRight(expect.toContainKey('composeWith'));
    });
  });

  describe('WHEN unsuccessfully build symbol model DAO (duplicated model)', () => {
    it('THEN it should return Left of error', () => {
      client.model(symbolModelName, new Schema({}));

      const repository = executeIo(buildSymbolDao(client));

      expect(repository).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
    });
  });
});
