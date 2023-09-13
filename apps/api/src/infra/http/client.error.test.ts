import { createExternalError } from '#shared/errors/externalError.js';
import { randomString } from '#test-utils/faker.js';

import { createHttpError, isHttpError } from './client.error.js';

describe('Validate HTTP error', () => {
  describe('WHEN validate an error that is a HTTP error', () => {
    it('THEN it should return true', () => {
      const externalError = createExternalError({ cause: new Error('Mock') });
      const error = createHttpError('InvalidRequest', randomString(), externalError);

      expect(isHttpError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a HTTP error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isHttpError(error)).toBeFalse();
    });
  });
});
