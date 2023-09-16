import { randomString } from '#test-utils/faker.js';

import { createMongoDbClientError, isMongoDbClientError } from './client.error.js';

describe('Validate MongoDb client error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a MongoDb client error without cause property',
      input: createMongoDbClientError('BuildClientFailed', randomString()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is a MongoDb client error with cause property',
      input: createMongoDbClientError('DisconnectFailed', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a MongoDb client error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isMongoDbClientError(input)).toBe(expected);
  });
});
