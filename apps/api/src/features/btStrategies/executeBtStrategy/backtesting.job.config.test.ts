import { resetEnvVar, setEnvVar } from '#test-utils/envVar.js';

import { getBtJobConfig } from './backtesting.job.config.js';

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('JOB_CONCURRENCY property', () => {
  describe.each([
    { env: '10', expected: 10 },
    { env: '0', expected: 1 },
    { env: '-1', expected: 1 },
    { env: '0.1', expected: 1 },
    { env: ' ', expected: 1 },
    { env: undefined, expected: 1 },
  ])(
    '[GIVEN] process.env.BT_JOB_CONCURRENCY = "$env" [WHEN] get backtesing job configuration',
    ({ env, expected }) => {
      beforeEach(setEnvVar('BT_JOB_CONCURRENCY', env));

      it(`[THEN] it will return JOB_CONCURRENCY property equals to "${expected}"`, () => {
        expect(getBtJobConfig()).toHaveProperty('JOB_CONCURRENCY', expected);
      });
    },
  );
});

describe('JOB_TIMEOUT_MS property', () => {
  describe.each([
    { env: '30000', expected: 30000 },
    { env: '0', expected: 10000 },
    { env: '-1', expected: 10000 },
    { env: '0.1', expected: 10000 },
    { env: ' ', expected: 10000 },
    { env: undefined, expected: 10000 },
  ])(
    '[GIVEN] process.env.BT_JOB_TIMEOUT_MS = "$env" [WHEN] get backtesing job configuration',
    ({ env, expected }) => {
      beforeEach(setEnvVar('BT_JOB_TIMEOUT_MS', env));

      it(`[THEN] it will return JOB_TIMEOUT_MS property equals to "${expected}"`, () => {
        expect(getBtJobConfig()).toHaveProperty('JOB_TIMEOUT_MS', expected);
      });
    },
  );
});

describe('PROGRESS_UPDATE_INTERVAL property', () => {
  describe.each([
    { env: '100', expected: 100 },
    { env: '0', expected: 1000 },
    { env: '-1', expected: 1000 },
    { env: '0.1', expected: 1000 },
    { env: ' ', expected: 1000 },
    { env: undefined, expected: 1000 },
  ])(
    '[GIVEN] process.env.BT_PROGRESS_UPDATE_INTERVAL = "$env" [WHEN] get backtesing job configuration',
    ({ env, expected }) => {
      beforeEach(setEnvVar('BT_PROGRESS_UPDATE_INTERVAL', env));

      it(`[THEN] it will return PROGRESS_UPDATE_INTERVAL property equals to "${expected}"`, () => {
        expect(getBtJobConfig()).toHaveProperty('PROGRESS_UPDATE_INTERVAL', expected);
      });
    },
  );
});

describe('JOB_WORKER_FILE_PATH property', () => {
  describe.each([
    { env: './test/file', expected: './test/file' },
    { env: '', expected: './worker.ts' },
    { env: ' ', expected: './worker.ts' },
    { env: undefined, expected: './worker.ts' },
  ])(
    '[GIVEN] process.env.BT_JOB_WORKER_FILE_PATH = "$env" [WHEN] get backtesing job configuration',
    ({ env, expected }) => {
      beforeEach(setEnvVar('BT_JOB_WORKER_FILE_PATH', env));

      it(`[THEN] it will return JOB_WORKER_FILE_PATH property equals to "${expected}"`, () => {
        expect(getBtJobConfig()).toHaveProperty('JOB_WORKER_FILE_PATH', expected);
      });
    },
  );
});
