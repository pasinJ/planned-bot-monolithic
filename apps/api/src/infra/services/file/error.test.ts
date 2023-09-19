import { randomString } from '#test-utils/faker.js';

import { createFileServiceError, isFileServiceError } from './error.js';

describe('Validate file service error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a file service error without cause property',
      input: createFileServiceError('ReadFileFailed', randomString()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is a file service error with cause property',
      input: createFileServiceError('WriteFileFailed', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a file service error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isFileServiceError(input)).toBe(expected);
  });
});
