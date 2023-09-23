import { randomString } from '#test-utils/faker/string.js';

import { createFileServiceError, isFileServiceError } from './error.js';

describe.each([
  {
    case: 'validate an error that is a file service error without cause property',
    input: createFileServiceError(randomString(), randomString()),
    expected: true,
  },
  {
    case: 'validate an error that is a file service error with cause property',
    input: createFileServiceError(randomString(), randomString(), new Error()),
    expected: true,
  },
  {
    case: 'validate an error that is not a file service error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isFileServiceError(input)).toBe(expected);
  });
});
