import { createExternalError } from '#shared/errors/externalError.js';
import { randomString } from '#test-utils/faker.js';

import { createBtStrategyModelDaoError, isBtStrategyModelDaoError } from './btStrategy.dao.error.js';

describe('Validate backtesting strategy model DAO error', () => {
  describe('WHEN validate an error that is a backtesting strategy model DAO error', () => {
    it('THEN it should return true', () => {
      const externalError = createExternalError({ cause: new Error('Mock') });
      const error = createBtStrategyModelDaoError('CreateDaoFailed', randomString(), externalError);

      expect(isBtStrategyModelDaoError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a backtesting strategy model DAO error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isBtStrategyModelDaoError(error)).toBeFalse();
    });
  });
});
