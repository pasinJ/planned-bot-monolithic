import { createExternalError } from '#shared/errors/externalError.js';
import { randomString } from '#test-utils/faker.js';

import { createSymbolRepoError, isSymbolRepoError } from './symbol.error.js';

describe('Validate symbol repository error', () => {
  describe('WHEN validate an error that is a symbol repository error', () => {
    it('THEN it should return false', () => {
      const externalError = createExternalError({ cause: new Error('Mock') });
      const error = createSymbolRepoError('CreateSymbolRepoError', randomString(), externalError);

      expect(isSymbolRepoError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a symbol repository error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isSymbolRepoError(error)).toBeFalse();
    });
  });
});
