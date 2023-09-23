import { resetEnvVar, setEnvVar } from '#test-utils/envVar.js';

import { getHttpConfig } from './server.config.js';

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('PORT_NUMBER property', () => {
  describe.each([
    { env: '8080', expected: 8080 },
    { env: '0', expected: 80 },
    { env: '-1', expected: 80 },
    { env: '0.1', expected: 80 },
    { env: ' ', expected: 80 },
    { env: undefined, expected: 80 },
  ])('[GIVEN] process.env.HTTP_PORT_NUMBER = "$env" [WHEN] get http configuration', ({ env, expected }) => {
    beforeEach(setEnvVar('HTTP_PORT_NUMBER', env));

    it(`[THEN] it will return PORT_NUMBER property equals to "${expected}"`, () => {
      expect(getHttpConfig()).toHaveProperty('PORT_NUMBER', expected);
    });
  });
});
