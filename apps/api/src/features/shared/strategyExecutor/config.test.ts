import { setEnvVar } from '#test-utils/envVar.js';

import { getStrategyExecutorConfig } from './config.js';

describe('LIBS_DIR_PATH property', () => {
  describe.each([
    { env: '/path/to/libs', expected: '/path/to/libs' },
    { env: '', expected: './src/libs' },
    { env: ' ', expected: './src/libs' },
    { env: undefined, expected: './src/libs' },
  ])(
    '[GIVEN] process.env.LIBS_DIR_PATH = "$env" [WHEN] get strategy executor configuration',
    ({ env, expected }) => {
      beforeEach(setEnvVar('LIBS_DIR_PATH', env));

      it(`[THEN] it will return LIBS_DIR_PATH property equals to "${expected}"`, () => {
        expect(getStrategyExecutorConfig()).toHaveProperty('LIBS_DIR_PATH', expected);
      });
    },
  );
});

describe('EXECUTE_TIMEOUT_MS property', () => {
  describe.each([
    { env: '10000', expected: 10000 },
    { env: '0', expected: 5000 },
    { env: '-1', expected: 5000 },
    { env: '0.1', expected: 5000 },
    { env: ' ', expected: 5000 },
    { env: undefined, expected: 5000 },
  ])(
    '[GIVEN] process.env.EXECUTE_STRATEGY_TIMEOUT_MS = "$env" [WHEN] get strategy executor configuration',
    ({ env, expected }) => {
      beforeEach(setEnvVar('EXECUTE_STRATEGY_TIMEOUT_MS', env));

      it(`[THEN] it will return EXECUTE_TIMEOUT_MS property equals to "${expected}"`, () => {
        expect(getStrategyExecutorConfig()).toHaveProperty('EXECUTE_TIMEOUT_MS', expected);
      });
    },
  );
});
