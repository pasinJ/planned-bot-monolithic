import { randomString } from '#test-utils/faker.js';

import { createBusinessError, isBusinessError } from './businessError.js';

describe('Validate business error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a business error without cause property',
      input: createBusinessError('Unhandled', randomString()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is a business error with cause property',
      input: createBusinessError('Unhandled', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a business error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isBusinessError(input)).toBe(expected);
  });
});
