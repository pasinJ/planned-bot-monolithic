import { createJobSchedulerError, isJobSchedulerError } from './error.js';

describe.each([
  {
    case: '[WHEN] validate an error that is a job schduler error without cause property',
    input: createJobSchedulerError('name', 'message'),
    expected: true,
  },
  {
    case: '[WHEN] validate an error that is a job schduler error with cause property',
    input: createJobSchedulerError('name', 'message', new Error()),
    expected: true,
  },
  {
    case: '[WHEN] validate an error that is not a job schduler error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isJobSchedulerError(input)).toBe(expected);
  });
});
