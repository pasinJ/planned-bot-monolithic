import { randomString } from '#test-utils/faker.js';

import { createHttpServerError, isHttpServerError } from './server.error.js';

describe('Validate HTTP server error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a HTTP server error without cause property',
      input: createHttpServerError('Unhandled', randomString()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is a HTTP server error with cause property',
      input: createHttpServerError('Unhandled', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a HTTP server error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isHttpServerError(input)).toBe(expected);
  });
});
