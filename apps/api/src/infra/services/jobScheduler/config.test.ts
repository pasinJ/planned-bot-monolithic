import { resetEnvVar, setEnvVar } from '#test-utils/envVar.js';

import { getJobSchedulerConfig } from './config.js';

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('URI property', () => {
  describe.each([
    { env: 'mongodb://127.0.0.1:27017/test', expected: 'mongodb://127.0.0.1:27017/test' },
    { env: 'invalid', expected: undefined },
    { env: ' ', expected: undefined },
    { env: undefined, expected: undefined },
  ])('WHEN process.env.MONGODB_URI = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('MONGODB_URI', env));

    it(`THEN URI property should equal to "${expected}"`, () => {
      expect(getJobSchedulerConfig()).toHaveProperty('URI', expected);
    });
  });
});

describe('COLLECTION_NAME property', () => {
  describe.each([
    { env: 'jobs', expected: 'jobs' },
    { env: '', expected: 'agenda' },
    { env: ' ', expected: 'agenda' },
    { env: undefined, expected: 'agenda' },
  ])('WHEN process.env.JOB_COLLECTION_NAME = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('JOB_COLLECTION_NAME', env));

    it(`THEN URI property should equal to "${expected}"`, () => {
      expect(getJobSchedulerConfig()).toHaveProperty('COLLECTION_NAME', expected);
    });
  });
});

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
      expect(getJobSchedulerConfig()).toHaveProperty('BT_JOB_CONCURRENCY', expected);
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
      expect(getJobSchedulerConfig()).toHaveProperty('BT_JOB_TIMEOUT_MS', expected);
    });
  });
});
