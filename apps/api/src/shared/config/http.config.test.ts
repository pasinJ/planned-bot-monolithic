import { resetEnvVar, setEnvVar } from '#test-utils/mockEnvVar.js';

import { getHttpConfig } from './http.config.js';

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('HTTP_CONF.PORT_NUMBER', () => {
  describe.each([
    { env: '8080', expected: 8080 },
    { env: '0', expected: 80 },
    { env: '-1', expected: 80 },
    { env: '0.1', expected: 80 },
    { env: ' ', expected: 80 },
    { env: undefined, expected: 80 },
  ])('WHEN process.env.HTTP_PORT_NUMBER = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('HTTP_PORT_NUMBER', env));

    it(`THEN HTTP_CONF.PORT_NUMBER should equal to "${expected}"`, () => {
      expect(getHttpConfig()).toHaveProperty('PORT_NUMBER', expected);
    });
  });
});
