import { createBusinessError, isBusinessError } from './businessError.js';

describe.each([
  {
    case: '[WHEN] validate an error that is a business error without cause property',
    input: createBusinessError('Unhandled', 'message'),
    expected: true,
  },
  {
    case: '[WHEN] validate an error that is a business error with cause property',
    input: createBusinessError('Unhandled', 'message', new Error()),
    expected: true,
  },
  {
    case: '[WHEN] validate an error that is not a business error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isBusinessError(input)).toBe(expected);
  });
});
