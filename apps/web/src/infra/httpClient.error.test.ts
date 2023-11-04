import { createHttpError, isHttpError } from './httpClient.error';

describe.each([
  {
    case: 'validate an error that is a HTTP error with cause property',
    input: createHttpError('InvalidRequest', 'message', new Error()),
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
