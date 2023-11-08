import { createStrategyExecutorError, isStrategyExecutorError } from './error.js';

describe.each([
  {
    case: 'validate an error that is a strategy executor error without cause property',
    input: createStrategyExecutorError('name', 'message'),
    expected: true,
  },
  {
    case: 'validate an error that is a strategy executor error with cause property',
    input: createStrategyExecutorError('name', 'message', new Error()),
    expected: true,
  },
  {
    case: 'validate an error that is not a strategy executor error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isStrategyExecutorError(input)).toBe(expected);
  });
});
