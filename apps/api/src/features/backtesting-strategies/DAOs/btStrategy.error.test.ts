import { randomString } from '#test-utils/faker.js';

import { createBtStrategyDaoError, isBtStrategyDaoError } from './btStrategy.error.js';

describe('Validate backtesting strategy DAO error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a backtesting strategy DAO error without cause property',
      input: createBtStrategyDaoError('BuildDaoFailed', randomString()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is a backtesting strategy DAO error with cause property',
      input: createBtStrategyDaoError('AddFailed', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a backtesting strategy DAO error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isBtStrategyDaoError(input)).toBe(expected);
  });
});
