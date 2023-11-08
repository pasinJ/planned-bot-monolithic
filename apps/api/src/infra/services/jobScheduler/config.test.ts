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
  ])(
    '[GIVEN] process.env.MONGODB_URI = "$env" [WHEN] get job scheduler configuration',
    ({ env, expected }) => {
      beforeEach(setEnvVar('MONGODB_URI', env));

      it(`[THEN] it will return URI property equals to "${expected}"`, () => {
        expect(getJobSchedulerConfig()).toHaveProperty('URI', expected);
      });
    },
  );
});

describe('COLLECTION_NAME property', () => {
  describe.each([
    { env: 'jobs', expected: 'jobs' },
    { env: '', expected: 'agenda' },
    { env: ' ', expected: 'agenda' },
    { env: undefined, expected: 'agenda' },
  ])(
    '[GIVEN] process.env.JOB_COLLECTION_NAME = "$env" [WHEN] get job scheduler configuration',
    ({ env, expected }) => {
      beforeEach(setEnvVar('JOB_COLLECTION_NAME', env));

      it(`[THEN] it will return COLLECTION_NAME property equals to "${expected}"`, () => {
        expect(getJobSchedulerConfig()).toHaveProperty('COLLECTION_NAME', expected);
      });
    },
  );
});
