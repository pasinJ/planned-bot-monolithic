import { faker } from '@faker-js/faker';
import { CustomError as CustomErrorBase } from 'ts-custom-error';

import { CustomError, createErrorFromUnknown, getErrorSummary } from '#utils/error';

const defaultName = faker.string.alpha(5);
const defaultMessage = faker.word.words(2);

class CustomErrorClass extends CustomError(defaultName, defaultMessage) {}

describe('Custom error', () => {
  describe('WHEN create an instance', () => {
    it('THEN it should inherit CustomError and Error', () => {
      const error = new CustomErrorClass();

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CustomErrorBase);
    });
  });
  describe('WHEN create an instance without parameters', () => {
    it('THEN it should return an instance with default name and message', () => {
      const error = new CustomErrorClass();

      expect(error).toHaveProperty('name', defaultName);
      expect(error).toHaveProperty('message', defaultMessage);
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('WHEN create an instance with only message', () => {
    it('THEN it should return an instance with default name and the given message', () => {
      const newMsg = faker.string.alpha(5);
      const error = new CustomErrorClass(newMsg);

      expect(error).toHaveProperty('name', defaultName);
      expect(error).toHaveProperty('message', newMsg);
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('WHEN create an instance with name and message', () => {
    it('THEN it should return an instance with the given name and message', () => {
      const newName = faker.string.alpha(5);
      const newMsg = faker.string.alpha(5);
      const error = new CustomErrorClass(newName, newMsg);

      expect(error).toHaveProperty('name', newName);
      expect(error).toHaveProperty('message', newMsg);
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('WHEN set cause of an instance with a string', () => {
    it('THEN it should return an instance with the cause', () => {
      const cause = faker.string.alpha(5);
      const error = new CustomErrorClass().causedBy(cause);

      expect(error).toHaveProperty('cause', cause);
    });
  });
  describe('WHEN set cause of an instance with an error', () => {
    it('THEN it should return an instance with the cause', () => {
      const cause = new Error('Mock error');
      const error = new CustomErrorClass().causedBy(cause);

      expect(error).toHaveProperty('cause', cause);
    });
  });
  describe('WHEN set cause of an instance that already has a cause', () => {
    it('THEN it should return an instance with the new given cause', () => {
      const cause = new Error('Mock error');
      const newCause = faker.string.alpha(5);
      const error = new CustomErrorClass().causedBy(cause).causedBy(newCause);

      expect(error).toHaveProperty('cause', newCause);
    });
  });
  describe('WHEN get a causes list from an error without cause', () => {
    it('THEN it should return an empty list', () => {
      const error = new CustomErrorClass();

      expect(error.getCausesList()).toBeArrayOfSize(0);
    });
  });
  describe('WHEN get a causes list from an error with string cause (1 depth)', () => {
    it('THEN it should return an list with the string cause', () => {
      const cause = faker.string.alpha(5);
      const error = new CustomErrorClass().causedBy(cause);

      expect(error.getCausesList()).toIncludeSameMembers([cause]);
    });
  });
  describe('WHEN get a causes list from an error with error cause (1 depth)', () => {
    it("THEN it should return an list with the error's name and message", () => {
      const cause = new Error('Mock error');
      const error = new CustomErrorClass().causedBy(cause);
      const causeSummary = `[${cause.name}] ${cause.message}`;

      expect(error.getCausesList()).toEqual([causeSummary]);
    });
  });
  describe('WHEN get a causes list from an error with nested error cause (2 depth)', () => {
    it("THEN it should return an list with the error's name and message", () => {
      const cause = new Error('Mock error');
      const nestedError = new CustomErrorClass().causedBy(cause);
      const error = new CustomErrorClass().causedBy(nestedError);

      const nestedErrorSummary = `[${nestedError.name}] ${nestedError.message}`;
      const nestedCauseSummary = `[${cause.name}] ${cause.message}`;
      expect(error.getCausesList()).toEqual([nestedErrorSummary, nestedCauseSummary]);
    });
  });
  describe('WHEN get a causes list from an error with nested error cause and string cause (3 depth)', () => {
    it("THEN it should return an list with the error's name and message", () => {
      const stringCause = faker.string.alpha(5);
      const nestedError2 = new CustomErrorClass().causedBy(stringCause);
      const nestedError1 = new CustomErrorClass().causedBy(nestedError2);
      const error = new CustomErrorClass().causedBy(nestedError1);

      const nestedErrorSummary1 = `[${nestedError1.name}] ${nestedError1.message}`;
      const nestedErrorSummary2 = `[${nestedError2.name}] ${nestedError2.message}`;
      expect(error.getCausesList()).toEqual([nestedErrorSummary1, nestedErrorSummary2, stringCause]);
    });
  });
  describe('GIVEN an error has no cause WHEN check if the error is caused by some error', () => {
    it('THEN it should return false', () => {
      const error = new CustomErrorClass();

      expect(error.isCausedBy('Some error')).toBeFalse();
    });
  });
  describe('GIVEN an error is caused by string WHEN check if the error is caused by that string', () => {
    it('THEN it should return true', () => {
      const cause = faker.string.alpha(5);
      const error = new CustomErrorClass().causedBy(cause);

      expect(error.isCausedBy(cause)).toBeTrue();
    });
  });
  describe('GIVEN an error is caused by some error WHEN check if the error is caused by that error', () => {
    it('THEN it should return true', () => {
      const cause = new Error('Mock error');
      const error = new CustomErrorClass().causedBy(cause);

      expect(error.isCausedBy(cause.name)).toBeTrue();
    });
  });
  describe('GIVEN an error is caused by some nested error WHEN check if the error is caused by the nested error', () => {
    it('THEN it should return true', () => {
      const cause = new Error('Mock error');
      const nestedError = new CustomErrorClass().causedBy(cause);
      const error = new CustomErrorClass().causedBy(nestedError);

      expect(error.isCausedBy(cause.name)).toBeTrue();
    });
  });
  describe('GIVEN an error has no cause WHEN stringify it', () => {
    it('THEN it should return string with name, message, and empty causes list', () => {
      const error = new CustomErrorClass();

      const errorString = JSON.stringify(error);
      const json = JSON.parse(errorString) as JSON;

      expect(json).toHaveProperty('name', error.name);
      expect(json).toHaveProperty('message', error.message);
      expect(json).toHaveProperty('causes', []);
    });
  });
  describe('GIVEN an error has string cause WHEN stringify it', () => {
    it('THEN it should return string with name, message, and causes list with the string cause', () => {
      const cause = faker.string.alpha(5);
      const error = new CustomErrorClass().causedBy(cause);

      const errorString = JSON.stringify(error);
      const json = JSON.parse(errorString) as JSON;

      expect(json).toHaveProperty('name', error.name);
      expect(json).toHaveProperty('message', error.message);
      expect(json).toHaveProperty('causes', [cause]);
    });
  });
  describe('GIVEN an error has error cause WHEN stringify it', () => {
    it('THEN it should return string with name, message, and causes list with summary of error cause', () => {
      const cause = new Error('Mock error');
      const error = new CustomErrorClass().causedBy(cause);

      const errorString = JSON.stringify(error);
      const json = JSON.parse(errorString) as JSON;

      expect(json).toHaveProperty('name', error.name);
      expect(json).toHaveProperty('message', error.message);
      expect(json).toHaveProperty('causes', [getErrorSummary(cause)]);
    });
  });
  describe('GIVEN an error has nested error cause WHEN stringify it', () => {
    it('THEN it should return string with name, message, and causes list with all nested causes', () => {
      const stringCause = faker.string.alpha(5);
      const nestedError2 = new CustomErrorClass().causedBy(stringCause);
      const nestedError1 = new CustomErrorClass().causedBy(nestedError2);
      const error = new CustomErrorClass().causedBy(nestedError1);

      const errorString = JSON.stringify(error);
      const json = JSON.parse(errorString) as JSON;

      expect(json).toHaveProperty('name', error.name);
      expect(json).toHaveProperty('message', error.message);
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
      const error = createErrorFromUnknown(CustomErrorClass, name)(input);

      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', input);
    });
  });
  describe('WHEN try to create a custom error from Error without specific message', () => {
    it('THEN it should return an error with message equal to summary of that error and cause equal to an External error', () => {
      const cause = faker.string.alpha(5);
      const input = new CustomErrorClass().causedBy(cause);
      const name = faker.string.alpha(5);
      const error = createErrorFromUnknown(CustomErrorClass, name)(input);

      const summary = `[${input.name}] ${input.message}`;
      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', summary);
      expect(error).toHaveProperty('cause.name', 'EXTERNAL_ERROR');
      expect(error).toHaveProperty('cause.cause', input);
    });
  });
  describe('WHEN try to create a custom error from Error with specific message', () => {
    it('THEN it should return an error with message equal to the given message and cause equal to an External error', () => {
      const cause = faker.string.alpha(5);
      const input = new CustomErrorClass().causedBy(cause);
      const name = faker.string.alpha(5);
      const msg = faker.string.alpha(5);
      const error = createErrorFromUnknown(CustomErrorClass, name, msg)(input);

      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', msg);
      expect(error).toHaveProperty('cause.name', 'EXTERNAL_ERROR');
      expect(error).toHaveProperty('cause.cause', input);
    });
  });
  describe('(Otherwise) WHEN try to create a custom error without specific message', () => {
    it('THEN it should return an error with predefined message', () => {
      const name = faker.string.alpha(5);
      const error = createErrorFromUnknown(CustomErrorClass, name)(undefined);

      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', 'Undefined message (created from unknown)');
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('(Otherwise) WHEN try to create a custom error with specific message', () => {
    it('THEN it should return an error with the given message', () => {
      const name = faker.string.alpha(5);
      const msg = faker.string.alpha(5);
      const error = createErrorFromUnknown(CustomErrorClass, name, msg)(undefined);

      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('message', msg);
      expect(error).not.toHaveProperty('cause');
    });
  });
});
