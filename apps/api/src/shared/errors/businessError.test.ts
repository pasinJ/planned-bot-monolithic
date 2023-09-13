import { randomString } from '#test-utils/faker.js';

import { createBusinessError, isBusinessError } from './businessError.js';

describe('Validate business error', () => {
  describe('WHEN validate an error that is a business error', () => {
    it('THEN it should return true', () => {
      const error = createBusinessError(randomString(), randomString());
      expect(isBusinessError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a business error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isBusinessError(error)).toBeFalse();
    });
  });
});
