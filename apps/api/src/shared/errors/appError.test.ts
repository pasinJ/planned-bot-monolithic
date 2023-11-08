import { createAppError, createErrorFromUnknown, getCausesList, isAppError, setCause } from './appError.js';

function createAppErrorWithOnlyName() {
  const name = 'name1';
  return { name, error: createAppError({ name }) };
}
function createAppErrorWithNameAndType() {
  const name = 'name2';
  const type = 'type2';
  return { name, type, error: createAppError({ name, type }) };
}
function createAppErrorWithNameAndTypeAndMessage() {
  const name = 'name3';
  const type = 'type3';
  const message = 'message3';
  return { name, type, message, error: createAppError({ name, type, message }) };
}
function createAppErrorWithNameAndTypeAndMessageAndCause(overrideCause?: Error | string) {
  const name = 'name4';
  const type = 'type4';
  const message = 'message4';
  const cause = overrideCause ?? 'cause4';
  return { name, type, message, cause, error: createAppError({ name, type, message, cause }) };
}

describe('UUT: Create an application error', () => {
  describe('[WHEN] create an instance', () => {
    it('[THEN] it will return an instance with stack property', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(error).toHaveProperty('stack');
    });
  });
  describe('[WHEN] create an instance with only name', () => {
    it('[THEN] it will return an instance with name property equals to the given value', () => {
      const { error, name } = createAppErrorWithOnlyName();
      expect(error).toHaveProperty('name', name);
    });
    it('[THEN] it will return an instance with message property equals to an empty string', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(error).toHaveProperty('message', '');
    });
    it('[THEN] it will return an instance without type and cause properties', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(error).not.toHaveProperty('type');
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('[WHEN] create an instance with name and type', () => {
    it('[THEN] it will return an instance with name and type properties equals to the given values', () => {
      const { error, name, type } = createAppErrorWithNameAndType();
      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('type', type);
    });
    it('[THEN] it will return an instance with message property equals to an empty string', () => {
      const { error } = createAppErrorWithNameAndType();
      expect(error).toHaveProperty('message', '');
    });
    it('[THEN] it will return an instance without cause property', () => {
      const { error } = createAppErrorWithNameAndType();
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('[WHEN] create an instance with name, type, and message', () => {
    it('[THEN] it will return an instance with name, type, and message properties equals to the given values', () => {
      const { error, name, type, message } = createAppErrorWithNameAndTypeAndMessage();
      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('type', type);
      expect(error).toHaveProperty('message', message);
    });
    it('[THEN] it will return an instance without cause property', () => {
      const { error } = createAppErrorWithNameAndTypeAndMessage();
      expect(error).not.toHaveProperty('cause');
    });
  });
  describe('[WHEN] create an instance with name, type, message, and cause', () => {
    it('[THEN] it will return an instance with those properties equals to the given values', () => {
      const { error, name, type, message, cause } = createAppErrorWithNameAndTypeAndMessageAndCause();
      expect(error).toHaveProperty('name', name);
      expect(error).toHaveProperty('type', type);
      expect(error).toHaveProperty('message', message);
      expect(error).toHaveProperty('cause', cause);
    });
  });
});

describe('UUT: Set cause', () => {
  describe('[WHEN] set cause of an instance that already has a cause property', () => {
    it('[THEN] it will return an instance with replaced cause property', () => {
      const { error } = createAppErrorWithNameAndTypeAndMessageAndCause();
      const newCause = 'newCause';

      expect(setCause(error, newCause)).toHaveProperty('cause', newCause);
    });
  });
});

describe('UUT: Get causes list', () => {
  describe('[WHEN] get a causes list from an error without cause', () => {
    it('[THEN] it will return an empty list', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(getCausesList(error)).toBeArrayOfSize(0);
    });
  });
  describe('[WHEN] get a causes list from an error with string cause (1 depth)', () => {
    it('[THEN] it will return an list with the string cause', () => {
      const { error, cause } = createAppErrorWithNameAndTypeAndMessageAndCause();
      expect(getCausesList(error)).toIncludeSameMembers([cause]);
    });
  });
  describe('[WHEN] get a causes list from an error with error cause (1 depth)', () => {
    it("[THEN] it will return an list with the error's name and message", () => {
      const { error, cause } = createAppErrorWithNameAndTypeAndMessageAndCause(new Error('Mock error'));

      expect(getCausesList(error)).toEqual([cause.toString()]);
    });
  });
  describe('[WHEN] get a causes list from an error with nested error cause (2 depth)', () => {
    it("[THEN] it will return an list with the error's name and message", () => {
      const { error: nestedError, cause } = createAppErrorWithNameAndTypeAndMessageAndCause(
        new Error('Mock error'),
      );
      const { error } = createAppErrorWithNameAndTypeAndMessageAndCause(nestedError);

      expect(getCausesList(error)).toEqual([nestedError.toString(), cause.toString()]);
    });
  });
  describe('[WHEN] get a causes list from an error with nested error cause and string cause (3 depth)', () => {
    it("[THEN] it will return an list with the error's name and message", () => {
      const { error: nestedError2, cause } = createAppErrorWithNameAndTypeAndMessageAndCause();
      const { error: nestedError1 } = createAppErrorWithNameAndTypeAndMessageAndCause(nestedError2);
      const { error } = createAppErrorWithNameAndTypeAndMessageAndCause(nestedError1);

      expect(getCausesList(error)).toEqual([nestedError1.toString(), nestedError2.toString(), cause]);
    });
  });
});

describe('UUT: Validate AppError', () => {
  describe('[WHEN] validate an application error instance', () => {
    it('[THEN] it will return true', () => {
      const { error } = createAppErrorWithOnlyName();
      expect(isAppError(error)).toBeTrue();
    });
  });
  describe('[WHEN] validate an object that is not an application error instance', () => {
    it('[THEN] it will return false', () => {
      expect(isAppError({ test: 'test' })).toBeFalse();
    });
  });
});

describe('UUT: Create custom error from unknown', () => {
  describe('[WHEN] create an custom error', () => {
    it('[THEN] it will return an error with name property equal to the given name', () => {
      const { error: baseError, name } = createAppErrorWithOnlyName();
      const error = createErrorFromUnknown(baseError)('cause');

      expect(error).toHaveProperty('name', name);
    });
  });
  describe('[WHEN] create a custom error from string', () => {
    it('[THEN] it will return an error with cause equals to that string', () => {
      const cause = 'cause';
      const { error: baseError } = createAppErrorWithOnlyName();
      const error = createErrorFromUnknown(baseError)(cause);

      expect(error).toHaveProperty('cause', cause);
    });
  });
  describe('[WHEN] create a custom error from an error', () => {
    it('[THEN] it will return an error with cause equal to that error', () => {
      const cause = new Error('Error');
      const { error: baseError } = createAppErrorWithOnlyName();
      const error = createErrorFromUnknown(baseError)(cause);

      expect(error).toHaveProperty('cause', cause);
    });
  });
  describe('[WHEN] create a custom error from something that is not neither string nor error', () => {
    it('[THEN] it will return an error with cause equal to an informative string', () => {
      const { error: baseError } = createAppErrorWithOnlyName();
      const error = createErrorFromUnknown(baseError)(undefined);

      expect(error).toHaveProperty('cause', expect.toBeString());
    });
  });
});
