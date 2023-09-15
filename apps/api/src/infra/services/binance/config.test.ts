import { resetEnvVar, setEnvVar } from '#test-utils/envVar.js';

import { getBnbConfig } from './config.js';

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

describe('PUBLIC_DATA_BASE_URL property', () => {
  describe.each([
    { env: 'http://localhost', expected: 'http://localhost' },
    { env: 'localhost', expected: 'https://data.binance.vision' },
    { env: ' ', expected: 'https://data.binance.vision' },
    { env: undefined, expected: 'https://data.binance.vision' },
  ])('WHEN process.env.BNB_PUBLIC_DATA_BASE_URL = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('BNB_PUBLIC_DATA_BASE_URL', env));

    it(`THEN PUBLIC_DATA_BASE_URL property should equal to "${expected}"`, () => {
      expect(getBnbConfig()).toHaveProperty('PUBLIC_DATA_BASE_URL', expected);
    });
  });
});

describe('DOWNLOAD_OUTPUT_PATH property', () => {
  describe.each([
    { env: './temp', expected: './temp' },
    { env: ' ', expected: './downloads' },
    { env: undefined, expected: './downloads' },
  ])('WHEN process.env.DOWNLOAD_OUTPUT_PATH = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('DOWNLOAD_OUTPUT_PATH', env));

    it(`THEN DOWNLOAD_OUTPUT_PATH property should equal to "${expected}"`, () => {
      expect(getBnbConfig()).toHaveProperty('DOWNLOAD_OUTPUT_PATH', expected);
    });
  });
});
