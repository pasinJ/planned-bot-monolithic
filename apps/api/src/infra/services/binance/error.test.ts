import { randomString } from '#test-utils/faker.js';

import { createBnbServiceError, isBnbServiceError } from './error.js';

describe('Validate binance service error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a binance service error without cause property',
      input: createBnbServiceError('CreateServiceFailed', randomString()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is a binance service error with cause property',
      input: createBnbServiceError('InvalidRequest', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a binance service error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isBnbServiceError(input)).toBe(expected);
  });
});
