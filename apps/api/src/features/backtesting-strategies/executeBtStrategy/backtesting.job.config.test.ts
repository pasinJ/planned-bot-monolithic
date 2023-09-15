import { resetEnvVar, setEnvVar } from '#test-utils/envVar.js';

import { getBtJobConfig } from './backtesting.job.config.js';

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('BT_JOB_CONCURRENCY property', () => {
  describe.each([
    { env: '10', expected: 10 },
    { env: '0', expected: 1 },
    { env: '-1', expected: 1 },
    { env: '0.1', expected: 1 },
    { env: ' ', expected: 1 },
    { env: undefined, expected: 1 },
  ])('WHEN process.env.BT_JOB_CONCURRENCY = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('BT_JOB_CONCURRENCY', env));

    it(`THEN URI property should equal to "${expected}"`, () => {
      expect(getBtJobConfig()).toHaveProperty('BT_JOB_CONCURRENCY', expected);
    });
  });
});

describe('BT_JOB_TIMEOUT_MS property', () => {
  describe.each([
    { env: '30000', expected: 30000 },
    { env: '0', expected: 10000 },
    { env: '-1', expected: 10000 },
    { env: '0.1', expected: 10000 },
    { env: ' ', expected: 10000 },
    { env: undefined, expected: 10000 },
  ])('WHEN process.env.BT_JOB_TIMEOUT_MS = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('BT_JOB_TIMEOUT_MS', env));

    it(`THEN URI property should equal to "${expected}"`, () => {
      expect(getBtJobConfig()).toHaveProperty('BT_JOB_TIMEOUT_MS', expected);
    });
  });
});
