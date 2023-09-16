import { randomString } from '#test-utils/faker.js';

import { createJobSchedulerError, isJobSchedulerError } from './error.js';

describe('Validate job schduler error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a job schduler error without cause property',
      input: createJobSchedulerError('CreateServiceFailed', randomString()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is a job schduler error with cause property',
      input: createJobSchedulerError('StopServiceFailed', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a job schduler error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isJobSchedulerError(input)).toBe(expected);
  });
});
