import { resetEnvVar, setEnvVar } from '#test-utils/mockEnvVar.js';

import { getBnbConfig } from './binance.js';

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('HTTP_BASE_URL property', () => {
  describe.each([
    { env: 'http://localhost', expected: 'http://localhost' },
    { env: 'localhost', expected: 'https://api.binance.com' },
    { env: ' ', expected: 'https://api.binance.com' },
    { env: undefined, expected: 'https://api.binance.com' },
  ])('WHEN process.env.BNB_HTTP_BASE_URL = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('BNB_HTTP_BASE_URL', env));

    it(`THEN HTTP_BASE_URL property should equal to "${expected}"`, () => {
      expect(getBnbConfig()).toHaveProperty('HTTP_BASE_URL', expected);
    });
  });
});
