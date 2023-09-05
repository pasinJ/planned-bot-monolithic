import { mockHttpError } from '#test-utils/error';
import { randomString } from '#test-utils/faker';

import { createSymbolRepoError, isSymbolRepoError } from './symbol.error';

describe('Validate symbol repository error', () => {
  describe('WHEN validate an error that is a symbol repository error', () => {
    it('THEN it should return false', () => {
      const error = createSymbolRepoError('GetSymbolsError', randomString(), mockHttpError());

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
