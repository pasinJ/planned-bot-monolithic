import { randomString } from '#test-utils/faker';

import { AppError, createAppError } from './appError';
import { ExternalError, createErrorFromUnknown, createExternalError, isExternalError } from './externalError';

const customErrorName = 'CustomError';
type CustomError = AppError<typeof customErrorName, string, ExternalError | undefined>;
function createCustomError(): CustomError {
  return createAppError({ name: customErrorName, cause: undefined as ExternalError | undefined });
}

describe('Validate external error', () => {
  describe('WHEN validate an error that is an external error', () => {
    it('THEN it should return false', () => {
      const error = createExternalError({ message: randomString(), cause: new Error('Mock') });
      expect(isExternalError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an error that is not an external error', () => {
    it('THEN it should return false', () => {
      const error = new Error('Mock');
      expect(isExternalError(error)).toBeFalse();
    });
  });
});

describe('Create custom error from unknown', () => {
  describe('WHEN create an custom error', () => {
    it('THEN it should return an error with name property equal to the given name', () => {
      const error = createErrorFromUnknown(createCustomError())(randomString());
      expect(error).toHaveProperty('name', customErrorName);
    });
  });
  describe('WHEN create a custom error from string', () => {
    it('THEN it should return an error with cause is an external error with cause property equal to that string', () => {
      const input = randomString();
      const error = createErrorFromUnknown(createCustomError())(input);

      expect(error).toHaveProperty('cause', expect.toSatisfy(isExternalError));
      expect(error.cause).toHaveProperty('cause', input);
    });
  });
  describe('WHEN create a custom error from an error', () => {
    it('THEN it should return an error with cause is an external error with cause property equal to that error', () => {
      const input = new Error(randomString());
      const error = createErrorFromUnknown(createCustomError())(input);

      expect(error).toHaveProperty('cause', expect.toSatisfy(isExternalError));
      expect(error.cause).toHaveProperty('cause', input);
    });
  });
  describe('WHEN create a custom error from something that is not neither string nor error', () => {
    it('THEN it should return an error with cause is an external error with cause property equal to an informative string', () => {
      const error = createErrorFromUnknown(createCustomError())(undefined);

      expect(error).toHaveProperty('cause', expect.toSatisfy(isExternalError));
      expect(error.cause).toHaveProperty('cause', expect.toBeString());
    });
  });
});
