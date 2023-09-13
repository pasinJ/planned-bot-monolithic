import { randomString } from '#test-utils/faker.js';

import { createGeneralError, isGeneralError } from './generalError.js';

describe('Validate general error', () => {
  describe('WHEN validate an error that is a general error', () => {
    it('THEN it should return true', () => {
      const error = createGeneralError({ type: randomString(), message: randomString() });
      expect(isGeneralError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a general error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isGeneralError(error)).toBeFalse();
    });
  });
});
