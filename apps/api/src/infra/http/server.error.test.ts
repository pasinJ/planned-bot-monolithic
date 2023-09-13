import { createExternalError } from '#shared/errors/externalError.js';
import { randomString } from '#test-utils/faker.js';

import { createHttpServerError, isHttpServerError } from './server.error.js';

describe('Validate HTTP server error', () => {
  describe('WHEN validate an error that is a HTTP server error', () => {
    it('THEN it should return true', () => {
      const externalError = createExternalError({ cause: new Error('Mock') });
      const error = createHttpServerError('UnhandledError', randomString(), externalError);

      expect(isHttpServerError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a HTTP server error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isHttpServerError(error)).toBeFalse();
    });
  });
});
