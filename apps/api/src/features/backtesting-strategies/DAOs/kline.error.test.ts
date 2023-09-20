import { randomString } from '#test-utils/faker.js';

import { createKlineDaoError, isKlineDaoError } from './kline.error.js';

describe('Validate kline DAO error', () => {
  it.each([
    {
      case: 'WHEN validate an error that is a kline DAO error without cause property',
      input: createKlineDaoError('BuildDaoFailed', randomString()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is a kline DAO error with cause property',
      input: createKlineDaoError('AddFailed', randomString(), new Error()),
      expected: true,
    },
    {
      case: 'WHEN validate an error that is not a kline DAO error',
      input: new Error(),
      expected: false,
    },
  ])('$case THEN it should return $expected', ({ input, expected }) => {
    expect(isKlineDaoError(input)).toBe(expected);
  });
});
