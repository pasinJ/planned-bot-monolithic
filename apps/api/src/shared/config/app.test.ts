import { resetEnvVar, setEnvVar } from '#test-utils/envVar.js';

import { getAppConfig } from './app.js';

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('ENV property', () => {
  describe.each([
    { env: 'production', expected: 'production' },
    { env: 'Test', expected: 'test' },
    { env: ' ', expected: 'development' },
    { env: undefined, expected: 'development' },
  ])('WHEN process.env.NODE_ENV = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('NODE_ENV', env));

    it(`THEN ENV property should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('ENV', expected);
    });
  });
});

describe('NAME property', () => {
  describe.each([
    { env: 'app name', expected: 'app name' },
    { env: ' ', expected: 'undefined name' },
    { env: undefined, expected: 'undefined name' },
  ])('WHEN process.env.APP_NAME = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('APP_NAME', env));

    it(`THEN NAME property should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('NAME', expected);
    });
  });
});

describe('VERSION property', () => {
  describe.each([
    { env: 'verion0-alpha', expected: 'verion0-alpha' },
    { env: ' ', expected: 'undefined version' },
    { env: undefined, expected: 'undefined version' },
  ])('WHEN process.env.APP_VERSION = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('APP_VERSION', env));

    it(`THEN VERSION property should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('VERSION', expected);
    });
  });
});

describe('GRACEFUL_PERIOD_MS property', () => {
  describe.each([
    { env: '10', expected: 10 },
    { env: '0', expected: 0 },
    { env: '-1', expected: 10000 },
    { env: '0.1', expected: 10000 },
    { env: ' ', expected: 10000 },
    { env: undefined, expected: 10000 },
  ])('WHEN process.env.APP_GRACEFUL_PERIOD_MS = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('APP_GRACEFUL_PERIOD_MS', env));

    it(`THEN GRACEFUL_PERIOD_MS property should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('GRACEFUL_PERIOD_MS', expected);
    });
  });
});

describe('LOG_LEVEL property', () => {
  describe.each([
    { env: 'error', expected: 'error' },
    { env: 'ERROR', expected: 'error' },
    { env: 'undefined', expected: 'info' },
    { env: ' ', expected: 'info' },
    { env: undefined, expected: 'info' },
  ])('WHEN process.env.LOG_LEVEL = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('LOG_LEVEL', env));

    it(`THEN LOG_LEVEL property should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('LOG_LEVEL', expected);
    });
  });
});

describe('LOG_FILE_ENABLE property', () => {
  describe.each([
    { env: 'true', expected: true },
    { env: 'TRUE', expected: true },
    { env: '10', expected: false },
    { env: 'undefined', expected: false },
    { env: ' ', expected: false },
    { env: undefined, expected: false },
  ])('WHEN process.env.LOG_FILE_ENABLE = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('LOG_FILE_ENABLE', env));

    it(`THEN LOG_FILE_ENABLE property should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('LOG_FILE_ENABLE', expected);
    });
  });
});

describe('LOG_FILE_PATH property', () => {
  describe.each([
    { env: './log/File.log', expected: './log/File.log' },
    { env: ' ', expected: undefined },
    { env: undefined, expected: undefined },
  ])('WHEN process.env.LOG_FILE_PATH = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('LOG_FILE_PATH', env));

    it(`THEN LOG_FILE_PATH property should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('LOG_FILE_PATH', expected);
    });
  });
});
