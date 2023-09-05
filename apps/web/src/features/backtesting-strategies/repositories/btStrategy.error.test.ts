import { mockHttpError } from '#test-utils/error';
import { randomString } from '#test-utils/faker';

import { createBtStrategyRepoError, isBtStrategyRepoError } from './btStrategy.error';

describe('Validate backtesting strategy repository error', () => {
  describe('WHEN validate an error that is a backtesting strategy repository error', () => {
    it('THEN it should return false', () => {
      const error = createBtStrategyRepoError('GetStrategiesError', randomString(), mockHttpError());

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
