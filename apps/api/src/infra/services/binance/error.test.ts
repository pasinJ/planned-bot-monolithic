import { createBnbServiceError, isBnbServiceError } from './error.js';

describe.each([
  {
    case: 'validate an error that is a binance service error without cause property',
    input: createBnbServiceError('name', 'message'),
    expected: true,
  },
  {
    case: 'validate an error that is a binance service error with cause property',
    input: createBnbServiceError('name', 'message', new Error()),
    expected: true,
  },
  {
    case: 'validate an error that is not a binance service error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isBnbServiceError(input)).toBe(expected);
  });
});
