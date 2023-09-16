import { randomString } from '#test-utils/faker.js';

import { createHttpError, isHttpError } from './client.error.js';

describe('Validate HTTP error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a HTTP error with cause property',
      input: createHttpError('InvalidRequest', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a HTTP error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isHttpError(input)).toBe(expected);
  });
});
