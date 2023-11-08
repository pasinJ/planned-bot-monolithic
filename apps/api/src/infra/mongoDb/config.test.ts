import { resetEnvVar, setEnvVar } from '#test-utils/envVar.js';

import { getMongoDbConfig } from './config.js';

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('URI property', () => {
  describe.each([
    { env: 'mongodb://127.0.0.1:27017/test', expected: 'mongodb://127.0.0.1:27017/test' },
    { env: 'invalid', expected: 'mongodb://localhost:27017' },
    { env: ' ', expected: 'mongodb://localhost:27017' },
    { env: undefined, expected: 'mongodb://localhost:27017' },
  ])('[GIVEN] process.env.MONGODB_URI = "$env" [WHEN] get mongoDB configuration', ({ env, expected }) => {
    beforeEach(setEnvVar('MONGODB_URI', env));

    it(`[THEN] it will return URI property equals to "${expected}"`, () => {
      expect(getMongoDbConfig()).toHaveProperty('URI', expected);
    });
  });
});
