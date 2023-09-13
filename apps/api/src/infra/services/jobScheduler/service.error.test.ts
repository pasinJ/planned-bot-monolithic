import { createExternalError } from '#shared/errors/externalError.js';
import { randomString } from '#test-utils/faker.js';

import { createJobSchedulerError, isJobSchedulerError } from './service.error.js';

describe('Validate job scheduler error', () => {
  describe('WHEN validate an error that is a job scheduler error', () => {
    it('THEN it should return true', () => {
      const externalError = createExternalError({ cause: new Error('Mock') });
      const error = createJobSchedulerError('CreateServiceFailed', randomString(), externalError);

      expect(isJobSchedulerError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not a job scheduler error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isJobSchedulerError(error)).toBeFalse();
    });
  });
});
