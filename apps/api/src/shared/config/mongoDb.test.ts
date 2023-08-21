import { resetEnvVar, setEnvVar } from '#test-utils/mockEnvVar.js';

import { getMongoDbConfig } from './mongoDb.js';

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('APP_CONF.ENV', () => {
  describe.each([
    { env: 'mongodb://127.0.0.1:27017/test', expected: 'mongodb://127.0.0.1:27017/test' },
    { env: 'invalid', expected: undefined },
    { env: ' ', expected: undefined },
    { env: undefined, expected: undefined },
  ])('WHEN process.env.MONGODB_URI = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('MONGODB_URI', env));

    it(`THEN URI should equal to "${expected}"`, () => {
      expect(getMongoDbConfig()).toHaveProperty('URI', expected);
    });
  });
});
