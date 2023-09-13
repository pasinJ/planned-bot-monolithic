import { createSchemaValidationError } from '#shared/utils/zod.js';
import { randomString } from '#test-utils/faker.js';

import { createSymbolDomainError, isSymbolDomainError } from './symbol.error.js';

describe('Validate backtesting strategy domain error', () => {
  describe('WHEN validate an error that is a backtesting strategy domain error', () => {
    it('THEN it should return true', () => {
      const validationError = createSchemaValidationError(
        'ValidationFailed',
        randomString(),
        new Error('Mock'),
      );
      const error = createSymbolDomainError('CreateSymbolError', randomString(), validationError);

      expect(isSymbolDomainError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a backtesting strategy domain error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isSymbolDomainError(error)).toBeFalse();
    });
  });
});
