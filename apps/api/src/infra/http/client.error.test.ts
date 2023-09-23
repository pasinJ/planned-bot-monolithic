import { randomString } from '#test-utils/faker/string.js';

import { createHttpError, isHttpError } from './client.error.js';

describe.each([
  {
    case: 'validate an error that is a HTTP error with cause property',
    input: createHttpError('InvalidRequest', randomString(), new Error()),
    expected: true,
  },
  {
    case: 'validate an error that is not a HTTP error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isHttpError(input)).toBe(expected);
  });
});
