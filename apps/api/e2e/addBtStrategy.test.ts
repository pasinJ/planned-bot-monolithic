import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/requests.js';

import { addBtStrategy } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

describe('WHEN user successfully add a backtesting strategy', () => {
  it('THEN it should return HTTP201 and the created backtesting strategy ID and timestamp', async () => {
    const body = mockValidAddBtStrategyRequestBody();
    const { response } = await addBtStrategy(body);

    expectHttpStatus(response, 201);
    expect(response.data).toEqual({ id: expect.toBeString(), createdAt: expect.toBeDateString() });
  });
});

describe('WHEN user try to add a backtesting strategy with invalid request body', () => {
  it('THEN it should return HTTP400 and error response body', async () => {
    const body = { ...mockValidAddBtStrategyRequestBody(), invalid: 'invalid' };
    const { response } = await addBtStrategy(body);

    expectHttpStatus(response, 400);
    expect(response.data).toEqual(toBeHttpErrorResponse);
  });
});
