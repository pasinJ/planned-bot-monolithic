import { createBtStrategyDaoError, isBtStrategyDaoError } from './btStrategy.error.js';

describe.each([
  {
    case: 'validate an error that is a backtesting strategy DAO error without cause property',
    input: createBtStrategyDaoError('name', 'message'),
    expected: true,
  },
  {
    case: 'validate an error that is a backtesting strategy DAO error with cause property',
    input: createBtStrategyDaoError('name', 'message', new Error()),
    expected: true,
  },
  {
    case: 'validate an error that is not a backtesting strategy DAO error',
    input: new Error(),
    expected: false,
  },
])('[WHEN] $case', ({ input, expected }) => {
  it(`[THEN] it will return ${expected}`, () => {
    expect(isBtStrategyDaoError(input)).toBe(expected);
  });
});
