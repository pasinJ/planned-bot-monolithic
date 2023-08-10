import { resetEnvVar, setEnvVar } from '#test-utils/mockEnvVar.js';

import { getAppConfig } from './app.config.js';

const originalEnv = process.env;

afterEach(resetEnvVar(originalEnv));

describe('APP_CONF.ENV', () => {
  describe.each([
    { env: 'production', expected: 'production' },
    { env: 'Test', expected: 'test' },
    { env: ' ', expected: 'development' },
    { env: undefined, expected: 'development' },
  ])('WHEN process.env.NODE_ENV = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('NODE_ENV', env));

    it(`THEN APP_CONF.ENV should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('ENV', expected);
    });
  });
});

describe('APP_CONF.NAME', () => {
  describe.each([
    { env: 'app name', expected: 'app name' },
    { env: ' ', expected: 'undefined name' },
    { env: undefined, expected: 'undefined name' },
  ])('WHEN process.env.APP_NAME = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('APP_NAME', env));

    it(`THEN APP_CONF.NAME should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('NAME', expected);
    });
  });
});

describe('APP_CONF.VERSION', () => {
  describe.each([
    { env: 'verion0-alpha', expected: 'verion0-alpha' },
    { env: ' ', expected: 'undefined version' },
    { env: undefined, expected: 'undefined version' },
  ])('WHEN process.env.APP_VERSION = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('APP_VERSION', env));

    it(`THEN APP_CONF.VERSION should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('VERSION', expected);
    });
  });
});

describe('APP_CONF.GRACEFUL_PERIOD_MS', () => {
  describe.each([
    { env: '10', expected: 10 },
    { env: '0', expected: 0 },
    { env: '-1', expected: 10000 },
    { env: '0.1', expected: 10000 },
    { env: ' ', expected: 10000 },
    { env: undefined, expected: 10000 },
  ])('WHEN process.env.APP_GRACEFUL_PERIOD_MS = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('APP_GRACEFUL_PERIOD_MS', env));

    it(`THEN APP_CONF.GRACEFUL_PERIOD_MS should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('GRACEFUL_PERIOD_MS', expected);
    });
  });
});

describe('APP_CONF.LOG_LEVEL', () => {
  describe.each([
    { env: 'error', expected: 'error' },
    { env: 'ERROR', expected: 'error' },
    { env: 'undefined', expected: 'info' },
    { env: ' ', expected: 'info' },
    { env: undefined, expected: 'info' },
  ])('WHEN process.env.LOG_LEVEL = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('LOG_LEVEL', env));

    it(`THEN APP_CONF.LOG_LEVEL should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('LOG_LEVEL', expected);
    });
  });
});

describe('APP_CONF.LOG_FILE_ENABLE', () => {
  describe.each([
    { env: 'true', expected: true },
    { env: 'TRUE', expected: true },
    { env: '10', expected: false },
    { env: 'undefined', expected: false },
    { env: ' ', expected: false },
    { env: undefined, expected: false },
  ])('WHEN process.env.LOG_FILE_ENABLE = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('LOG_FILE_ENABLE', env));

    it(`THEN APP_CONF.LOG_FILE_ENABLE should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('LOG_FILE_ENABLE', expected);
    });
  });
});

describe('APP_CONF.LOG_FILE_PATH', () => {
  describe.each([
    { env: './log/File.log', expected: './log/File.log' },
    { env: ' ', expected: undefined },
    { env: undefined, expected: undefined },
  ])('WHEN process.env.LOG_FILE_PATH = "$env"', ({ env, expected }) => {
    beforeEach(setEnvVar('LOG_FILE_PATH', env));

    it(`THEN APP_CONF.LOG_FILE_PATH should equal to "${expected}"`, () => {
      expect(getAppConfig()).toHaveProperty('LOG_FILE_PATH', expected);
    });
  });
});
