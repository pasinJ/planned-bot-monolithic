import { createExternalError } from '#shared/errors/externalError.js';
import { randomString } from '#test-utils/faker.js';

import { createMongoDbClientError, isMongoDbClientError } from './client.error.js';

describe('Validate MongoDb client error', () => {
  describe('WHEN validate an error that is a MongoDb client error', () => {
    it('THEN it should return true', () => {
      const externalError = createExternalError({ cause: new Error('Mock') });
      const error = createMongoDbClientError('CreateClientFailed', randomString(), externalError);

      expect(isMongoDbClientError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a MongoDb client error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isMongoDbClientError(error)).toBeFalse();
    });
  });
});
