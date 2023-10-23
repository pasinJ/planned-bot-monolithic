import { createGeneralError, isGeneralError } from './generalError';

describe.each([
  {
    case: '[WHEN] validate an error that is a general error without cause property',
    input: createGeneralError('name', 'message'),
    expected: true,
  },
  {
    case: '[WHEN] validate an error that is a general error with cause property',
    input: createGeneralError('name', 'message', new Error()),
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
