import { createExternalError } from '#shared/errors/externalError.js';
import { randomString } from '#test-utils/faker.js';

import { createSymbolModelDaoError, isSymbolModelDaoError } from './symbol.dao.error.js';

describe('Validate symbol model DAO error', () => {
  describe('WHEN validate an error that is a symbol model DAO error', () => {
    it('THEN it should return true', () => {
      const externalError = createExternalError({ cause: new Error('Mock') });
      const error = createSymbolModelDaoError('CreateDaoFailed', randomString(), externalError);

      expect(isSymbolModelDaoError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a symbol model DAO error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isSymbolModelDaoError(error)).toBeFalse();
    });
  });
});
