import { randomString } from '#test-utils/faker.js';

import { createSymbolDaoError, isSymbolDaoError } from './symbol.error.js';

describe('Validate symbol DAO error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a symbol DAO error without cause property',
      input: createSymbolDaoError('BuildDaoFailed', randomString()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is a symbol DAO error with cause property',
      input: createSymbolDaoError('AddFailed', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a symbol DAO error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isSymbolDaoError(input)).toBe(expected);
  });
});
