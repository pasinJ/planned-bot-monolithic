import { Schema } from 'mongoose';

import { executeIo } from '#shared/utils/fp.js';
import { createMongoClient, deleteModel } from '#test-utils/mongoDb.js';

import { isSymbolDaoError } from './symbol.error.js';
import { buildSymbolDao, symbolModelName } from './symbol.js';

const client = await createMongoClient();

afterAll(() => client.disconnect());

describe('UUT: Build symbol DAO', () => {
  afterEach(() => deleteModel(client, symbolModelName));

  describe('[GIVEN] symbol DAO has not been built', () => {
    describe('[WHEN] build a symbol DAO', () => {
      it('[THEN] it will create mongoose model', () => {
        executeIo(buildSymbolDao(client));

        expect(client.models).toHaveProperty(symbolModelName);
      });
      it('[THEN] it will return Right of symbol DAO', () => {
        const dao = executeIo(buildSymbolDao(client));

        expect(dao).toEqualRight(expect.toContainKey('composeWith'));
      });
    });
  });

  describe('[GIVEN] symbol DAO has already been built', () => {
    describe('[WHEN] build a symbol DAO', () => {
      it('[THEN] it will return Left of error', () => {
        client.model(symbolModelName, new Schema({}));

        const dao = executeIo(buildSymbolDao(client));

        expect(dao).toEqualLeft(expect.toSatisfy(isSymbolDaoError));
      });
    });
  });
});
