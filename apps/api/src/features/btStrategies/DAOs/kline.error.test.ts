import { createKlineDaoError, isKlineDaoError } from './kline.error.js';

describe.each([
  {
    case: 'validate an error that is a kline DAO error without cause property',
    input: createKlineDaoError('name', 'message'),
    expected: true,
  },
  {
    case: 'validate an error that is a kline DAO error with cause property',
    input: createKlineDaoError('name', 'message', new Error()),
    expected: true,
  },
  {
    case: 'validate an error that is not a kline DAO error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isKlineDaoError(input)).toBe(expected);
  });
});
