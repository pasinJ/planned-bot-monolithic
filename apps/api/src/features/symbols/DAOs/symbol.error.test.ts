import { createSymbolDaoError, isSymbolDaoError } from './symbol.error.js';

describe.each([
  {
    case: 'validate an error that is a symbol DAO error without cause property',
    input: createSymbolDaoError('name', 'message'),
    expected: true,
  },
  {
    case: 'validate an error that is a symbol DAO error with cause property',
    input: createSymbolDaoError('name', 'message', new Error()),
    expected: true,
  },
  {
    case: 'validate an error that is not a symbol DAO error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isSymbolDaoError(input)).toBe(expected);
  });
});
