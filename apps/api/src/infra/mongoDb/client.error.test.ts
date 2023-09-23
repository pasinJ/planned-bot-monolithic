import { randomString } from '#test-utils/faker/string.js';

import { createMongoDbClientError, isMongoDbClientError } from './client.error.js';

describe.each([
  {
    case: 'validate an error that is a MongoDb client error without cause property',
    input: createMongoDbClientError('BuildClientFailed', randomString()),
    expected: true,
  },
  {
    case: 'validate an error that is a MongoDb client error with cause property',
    input: createMongoDbClientError('DisconnectFailed', randomString(), new Error()),
    expected: true,
  },
  {
    case: 'validate an error that is not a MongoDb client error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isMongoDbClientError(input)).toBe(expected);
  });
});
