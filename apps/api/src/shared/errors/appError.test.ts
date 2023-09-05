import { randomString } from '#test-utils/faker.js';

import { createAppError, isAppError } from './appError.js';

function createAppErrorWithOnlyName() {
  const name = randomString();
  return { name, error: createAppError({ name, cause: undefined }) };
}
function createAppErrorWithNameAndType() {
  const name = randomString();
  const type = randomString();
  return { name, type, error: createAppError({ name, type, cause: undefined }) };
}
function createAppErrorWithNameAndTypeAndMessage() {
  const name = randomString();
  const type = randomString();
  const message = randomString();
  return { name, type, message, error: createAppError({ name, type, message, cause: undefined }) };
}
function createAppErrorWithNameAndTypeAndMessageAndCause(overrideCause?: Error | string) {
  const name = randomString();
  const type = randomString();
  const message = randomString();
  const cause = overrideCause ?? randomString();
  return { name, type, message, cause, error: createAppError({ name, type, message, cause }) };
}

describe('Application error', () => {
  describe('WHEN create an instance', () => {
    it('THEN it should return an instance that inherits from Error', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(error).toBeInstanceOf(Error);
    });
    it('THEN it should return an instance with stack property', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(error).toHaveProperty('stack');
    });
  });
  describe('WHEN create an instance with only name', () => {
    it('THEN it should return an instance with name property equals to the given value', () => {
      const { error, name } = createAppErrorWithOnlyName();
      expect(error).toHaveProperty('name', name);
    });
    it('THEN it should return an instance with message property equals to an empty string', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(error).toHaveProperty('message', '');
    });
    it('THEN it should return an instance without type and cause properties', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(error).not.toHaveProperty('type');
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('WHEN create an instance with name and type', () => {
    it('THEN it should return an instance with name and type properties equals to the given values', () => {
      const { error, name, type } = createAppErrorWithNameAndType();
      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('type', type);
    });
    it('THEN it should return an instance with message property equals to an empty string', () => {
      const { error } = createAppErrorWithNameAndType();
      expect(error).toHaveProperty('message', '');
    });
    it('THEN it should return an instance without cause property', () => {
      const { error } = createAppErrorWithNameAndType();
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('WHEN create an instance with name, type, and message', () => {
    it('THEN it should return an instance with name, type, and message properties equals to the given values', () => {
      const { error, name, type, message } = createAppErrorWithNameAndTypeAndMessage();
      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('type', type);
      expect(error).toHaveProperty('message', message);
    });
    it('THEN it should return an instance without cause property', () => {
      const { error } = createAppErrorWithNameAndTypeAndMessage();
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('WHEN create an instance with name, type, message, and cause', () => {
    it('THEN it should return an instance with those properties equals to the given values', () => {
      const { error, name, type, message, cause } = createAppErrorWithNameAndTypeAndMessageAndCause();
      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('type', type);
      expect(error).toHaveProperty('message', message);
      expect(error).toHaveProperty('cause', cause);
    });
  });

  describe('WHEN set cause of an instance that already has a cause property', () => {
    it('THEN it should return an instance with replaced cause property', () => {
      const { error } = createAppErrorWithNameAndTypeAndMessageAndCause();
      const newCause = randomString();

      expect(error.setCause(newCause)).toHaveProperty('cause', newCause);
    });
  });

  describe('WHEN get a causes list from an error without cause', () => {
    it('THEN it should return an empty list', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(error.causesList).toBeArrayOfSize(0);
    });
  });
  describe('WHEN get a causes list from an error with string cause (1 depth)', () => {
    it('THEN it should return an list with the string cause', () => {
      const { error, cause } = createAppErrorWithNameAndTypeAndMessageAndCause();
      expect(error.causesList).toIncludeSameMembers([cause]);
    });
  });
  describe('WHEN get a causes list from an error with error cause (1 depth)', () => {
    it("THEN it should return an list with the error's name and message", () => {
      const { error, cause } = createAppErrorWithNameAndTypeAndMessageAndCause(new Error('Mock error'));

      expect(error.causesList).toEqual([cause.toString()]);
    });
  });
  describe('WHEN get a causes list from an error with nested error cause (2 depth)', () => {
    it("THEN it should return an list with the error's name and message", () => {
      const { error: nestedError, cause } = createAppErrorWithNameAndTypeAndMessageAndCause(
        new Error('Mock error'),
      );
      const { error } = createAppErrorWithNameAndTypeAndMessageAndCause(nestedError);

      expect(error.causesList).toEqual([nestedError.toString(), cause.toString()]);
    });
  });
  describe('WHEN get a causes list from an error with nested error cause and string cause (3 depth)', () => {
    it("THEN it should return an list with the error's name and message", () => {
      const { error: nestedError2, cause } = createAppErrorWithNameAndTypeAndMessageAndCause();
      const { error: nestedError1 } = createAppErrorWithNameAndTypeAndMessageAndCause(nestedError2);
      const { error } = createAppErrorWithNameAndTypeAndMessageAndCause(nestedError1);

      expect(error.causesList).toEqual([nestedError1.toString(), nestedError2.toString(), cause]);
    });
  });
});

describe('isAppError function', () => {
  describe('WHEN validate an application error instance', () => {
    it('THEN it should return true', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(isAppError(error)).toBeTrue();
    });
  });
  describe('WHEN validate an object that is not an application error instance', () => {
    it('THEN it should return false', () => {
      expect(isAppError({ test: randomString() })).toBeFalse();
    });
  });
});
