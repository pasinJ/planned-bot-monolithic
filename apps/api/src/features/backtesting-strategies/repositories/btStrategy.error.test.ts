import { createExternalError } from '#shared/errors/externalError.js';
import { randomString } from '#test-utils/faker.js';

import { createBtStrategyRepoError, isBtStrategyRepoError } from './btStrategy.error.js';

describe('Validate backtesting strategy repository error', () => {
  describe('WHEN validate an error that is a backtesting strategy repository error', () => {
    it('THEN it should return true', () => {
      const externalError = createExternalError({ cause: new Error('Mock') });
      const error = createBtStrategyRepoError('CreateBtStrategyRepoError', randomString(), externalError);

      expect(isBtStrategyRepoError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a backtesting strategy repository error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isBtStrategyRepoError(error)).toBeFalse();
    });
  });
});
