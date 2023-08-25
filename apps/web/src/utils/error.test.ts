import { faker } from '@faker-js/faker';
import { CustomError } from 'ts-custom-error';

import { ErrorBase, createErrorFromUnknown, getErrorSummary } from '#utils/error';

function createCustomError(cause?: Error | string) {
  const name = faker.string.alpha(5);
  const msg = faker.word.words(2);
  return { name, msg, error: new ErrorBase(name, msg, cause) };
}

type CustomErrorWithCause<T> = { error: ErrorBase; name: string; msg: string; cause: T };
function createCustomErrorWithCause(causeType: 'string'): CustomErrorWithCause<string>;
function createCustomErrorWithCause(causeType: 'error'): CustomErrorWithCause<Error>;
function createCustomErrorWithCause(causeType: 'string' | 'error') {
  const cause = causeType === 'string' ? faker.word.words(2) : new Error(faker.string.alpha(5));
  return { ...createCustomError(cause), cause };
}

describe('Custom error', () => {
  describe('WHEN create an instance', () => {
    it('THEN it should return an instance with the passed name and message without cause', () => {
      const { error, name, msg } = createCustomError();

      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', msg);
      expect(error).not.toHaveProperty('cause');
    });
    it('THEN it should inherit CustomError and Error', () => {
      const { error } = createCustomError();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CustomError);
    });
  });
  describe('WHEN create an instance with a string cause', () => {
    it('THEN it should return an instance with the cause', () => {
      const { error, cause } = createCustomErrorWithCause('string');

      expect(error).toHaveProperty('cause', cause);
    });
  });
  describe('WHEN create an instance with an error cause', () => {
    it('THEN it should return an instance with the cause', () => {
      const { error, cause } = createCustomErrorWithCause('error');

      expect(error).toHaveProperty('cause', cause);
    });
  });
  describe('WHEN replace cause by something else', () => {
    it('THEN it should return an instance with the new cause', () => {
      const { error } = createCustomErrorWithCause('error');

      const newCause = faker.word.words(2);
      const newError = error.causedBy(newCause);

      expect(newError).toHaveProperty('cause', newCause);
    });
  });
  describe('WHEN get a causes list from an error without cause', () => {
    it('THEN it should return an empty list', () => {
      const { error } = createCustomError();

      expect(error.getCausesList()).toBeArrayOfSize(0);
    });
  });
  describe('WHEN get a causes list from an error with string cause (1 depth)', () => {
    it('THEN it should return an list with the string cause', () => {
      const { error, cause } = createCustomErrorWithCause('string');

      expect(error.getCausesList()).toIncludeSameMembers([cause]);
    });
  });
  describe('WHEN get a causes list from an error with error cause (1 depth)', () => {
    it("THEN it should return an list with the error's name and message", () => {
      const { error, cause } = createCustomErrorWithCause('error');
      const causeSummary = `[${cause.name}] ${cause.message}`;

      expect(error.getCausesList()).toEqual([causeSummary]);
    });
  });
  describe('WHEN get a causes list from an error with nested error cause (2 depth)', () => {
    it("THEN it should return an list with the error's name and message", () => {
      const { error: nestedError, cause } = createCustomErrorWithCause('error');
      const { error } = createCustomError();
      error.causedBy(nestedError);

      const nestedErrorSummary = `[${nestedError.name}] ${nestedError.message}`;
      const nestedCauseSummary = `[${cause.name}] ${cause.message}`;
      expect(error.getCausesList()).toEqual([nestedErrorSummary, nestedCauseSummary]);
    });
  });
  describe('WHEN get a causes list from an error with nested error cause and string cause (3 depth)', () => {
    it("THEN it should return an list with the error's name and message", () => {
      const { error: nestedError1 } = createCustomError();
      const { error: nestedError2, cause: stringCause } = createCustomErrorWithCause('string');
      nestedError1.causedBy(nestedError2);

      const { error } = createCustomError();
      error.causedBy(nestedError1);

      const nestedErrorSummary1 = `[${nestedError1.name}] ${nestedError1.message}`;
      const nestedErrorSummary2 = `[${nestedError2.name}] ${nestedError2.message}`;
      expect(error.getCausesList()).toEqual([nestedErrorSummary1, nestedErrorSummary2, stringCause]);
    });
  });
  describe('GIVEN an error has no cause WHEN check if the error is caused by som error', () => {
    it('THEN it should return false', () => {
      const { error } = createCustomError();

      expect(error.isCausedBy('Some error')).toBeFalse();
    });
  });
  describe('GIVEN an error is caused by string WHEN check if the error is caused by that string', () => {
    it('THEN it should return true', () => {
      const { error, cause } = createCustomErrorWithCause('string');

      expect(error.isCausedBy(cause)).toBeTrue();
    });
  });
  describe('GIVEN an error is caused by some error WHEN check if the error is caused by that error', () => {
    it('THEN it should return true', () => {
      const { error, cause } = createCustomErrorWithCause('error');

      expect(error.isCausedBy(cause.name)).toBeTrue();
    });
  });
  describe('GIVEN an error is caused by some nested error WHEN check if the error is caused by the nested error', () => {
    it('THEN it should return true', () => {
      const { error: nestedError, cause } = createCustomErrorWithCause('error');
      const { error } = createCustomError();
      error.causedBy(nestedError);

      expect(error.isCausedBy(cause.name)).toBeTrue();
    });
  });
  describe('GIVEN an error has no cause WHEN stringify it', () => {
    it('THEN it should return string with name, message, and empty causes list', () => {
      const { error, name, msg } = createCustomError();

      const errorString = JSON.stringify(error);
      const json = JSON.parse(errorString) as JSON;

      expect(json).toHaveProperty('name', name);
      expect(json).toHaveProperty('message', msg);
      expect(json).toHaveProperty('causes', []);
    });
  });
  describe('GIVEN an error has string cause WHEN stringify it', () => {
    it('THEN it should return string with name, message, and causes list with the string cause', () => {
      const { error, name, msg, cause } = createCustomErrorWithCause('string');

      const errorString = JSON.stringify(error);
      const json = JSON.parse(errorString) as JSON;

      expect(json).toHaveProperty('name', name);
      expect(json).toHaveProperty('message', msg);
      expect(json).toHaveProperty('causes', [cause]);
    });
  });
  describe('GIVEN an error has error cause WHEN stringify it', () => {
    it('THEN it should return string with name, message, and causes list with summary of error cause', () => {
      const { error, name, msg, cause } = createCustomErrorWithCause('error');

      const errorString = JSON.stringify(error);
      const json = JSON.parse(errorString) as JSON;

      expect(json).toHaveProperty('name', name);
      expect(json).toHaveProperty('message', msg);
      expect(json).toHaveProperty('causes', [getErrorSummary(cause)]);
    });
  });
  describe('GIVEN an error has nested error cause WHEN stringify it', () => {
    it('THEN it should return string with name, message, and causes list with all nested causes', () => {
      const { error: nestedError1 } = createCustomError();
      const { error: nestedError2, cause: stringCause } = createCustomErrorWithCause('string');
      nestedError1.causedBy(nestedError2);

      const { error, name, msg } = createCustomError();
      error.causedBy(nestedError1);

      const errorString = JSON.stringify(error);
      const json = JSON.parse(errorString) as JSON;

      expect(json).toHaveProperty('name', name);
      expect(json).toHaveProperty('message', msg);
      expect(json).toHaveProperty('causes', [
        getErrorSummary(nestedError1),
        getErrorSummary(nestedError2),
        stringCause,
      ]);
    });
  });
});

describe('Create custom error from unknown', () => {
  describe('WHEN try to create a custom error from string', () => {
    it('THEN it should return an error with message equal to that string', () => {
      const name = faker.string.alpha(5);
      const input = faker.string.alpha(5);
      const error = createErrorFromUnknown(ErrorBase, name)(input);

      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', input);
    });
  });
  describe('WHEN try to create a custom error from Error without specific message', () => {
    it('THEN it should return an error with message equal to summary of that error and cause equal to an External error', () => {
      const { error: input } = createCustomErrorWithCause('string');
      const name = faker.string.alpha(5);
      const error = createErrorFromUnknown(ErrorBase, name)(input);

      const summary = `[${input.name}] ${input.message}`;
      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', summary);
      expect(error).toHaveProperty('cause.name', 'EXTERNAL_ERROR');
      expect(error).toHaveProperty('cause.cause', input);
    });
  });
  describe('WHEN try to create a custom error from Error with specific message', () => {
    it('THEN it should return an error with message equal to the given message and cause equal to an External error', () => {
      const { error: input } = createCustomErrorWithCause('string');
      const name = faker.string.alpha(5);
      const msg = faker.string.alpha(5);
      const error = createErrorFromUnknown(ErrorBase, name, msg)(input);

      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', msg);
      expect(error).toHaveProperty('cause.name', 'EXTERNAL_ERROR');
      expect(error).toHaveProperty('cause.cause', input);
    });
  });
  describe('(Otherwise) WHEN try to create a custom error without specific message', () => {
    it('THEN it should return an error with predefined message', () => {
      const name = faker.string.alpha(5);
      const error = createErrorFromUnknown(ErrorBase, name)(undefined);

      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', 'Undefined message (created from unknown)');
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('(Otherwise) WHEN try to create a custom error with specific message', () => {
    it('THEN it should return an error with the given message', () => {
      const name = faker.string.alpha(5);
      const msg = faker.string.alpha(5);
      const error = createErrorFromUnknown(ErrorBase, name, msg)(undefined);

      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', msg);
      expect(error).not.toHaveProperty('cause');
    });
  });
});
