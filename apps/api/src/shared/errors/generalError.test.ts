import { randomString } from '#test-utils/faker/string.js';

import { createGeneralError, isGeneralError } from './generalError.js';

describe.each([
  {
    case: '[WHEN] validate an error that is a general error without cause property',
    input: createGeneralError(randomString(), randomString()),
    expected: true,
  },
  {
    case: '[WHEN] validate an error that is a general error with cause property',
    input: createGeneralError(randomString(), randomString(), new Error()),
    expected: true,
  },
  {
    case: '[WHEN] validate an error that is not a general error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isGeneralError(input)).toBe(expected);
  });
});
