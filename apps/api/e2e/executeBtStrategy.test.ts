import { path } from 'ramda';

import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { randomString } from '#test-utils/faker.js';

import { addBtStrategy, executeBtStrategy } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

describe('GIVEN the backtesting strategy does not exist WHEN user requests to execute the strategy', () => {
  it('THEN it should return HTTP404 and error response body', async () => {
    const { response } = await executeBtStrategy(randomString());

    expectHttpStatus(response, 404);
    expect(response.data).toEqual(toBeHttpErrorResponse);
  });
});

describe('GIVEN the backtesting strategy already exists WHEN user requests to execute the strategy', () => {
  it('THEN it should return HTTP202 and response body with id, created timestamp, progress path, and result path', async () => {
    const { response: addResponse } = await addBtStrategy();
    const btStrategyId = path(['data', 'id'], addResponse) as string;

    const { response: executeResponse } = await executeBtStrategy(btStrategyId);

    expectHttpStatus(executeResponse, 202);
    expect(executeResponse.data).toEqual({
      id: expect.toBeString(),
      createdAt: expect.toBeDateString(),
      progressPath: expect.toInclude(btStrategyId),
      resultPath: expect.toInclude(btStrategyId),
    });
  });
});
