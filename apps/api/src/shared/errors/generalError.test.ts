import { randomString } from '#test-utils/faker.js';

import { createGeneralError, isGeneralError } from './generalError.js';

describe('Validate general error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a general error without cause property',
      input: createGeneralError('Unhandled', randomString()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is a general error with cause property',
      input: createGeneralError('Unhandled', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a general error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isGeneralError(input)).toBe(expected);
  });
});
