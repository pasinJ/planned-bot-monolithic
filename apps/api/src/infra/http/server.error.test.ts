import { createHttpServerError, isHttpServerError } from './server.error.js';

describe.each([
  {
    case: 'validate an error that is a HTTP server error without cause property',
    input: createHttpServerError('Unhandled', 'message'),
    expected: true,
  },
  {
    case: 'validate an error that is a HTTP server error with cause property',
    input: createHttpServerError('Unhandled', 'message', new Error()),
    expected: true,
  },
  {
    case: 'validate an error that is not a HTTP server error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isHttpServerError(input)).toBe(expected);
  });
});
