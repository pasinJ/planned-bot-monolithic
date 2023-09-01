import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/requests.js';

import { addBtStrategy } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

describe('WHEN user successfully add a backtesting strategy', () => {
  it('THEN it should return HTTP201 and the created backtesting strategy', async () => {
    const body = mockValidAddBtStrategyRequestBody();
    const resp = await addBtStrategy(body);

    expectHttpStatus(resp, 201);
    expect(resp.data).toEqual(
      expect.objectContaining({
        ...body,
        id: expect.toBeString(),
        startTimestamp: expect.toBeDateString(),
        endTimestamp: expect.toBeDateString(),
        createdAt: expect.toBeDateString(),
        updatedAt: expect.toBeDateString(),
      }),
    );
  });
});

describe('WHEN user try to add a backtesting strategy with invalid request body', () => {
  it('THEN it should return HTTP400 and error response body', async () => {
    const body = { ...mockValidAddBtStrategyRequestBody(), invalid: 'invalid' };
    const resp = await addBtStrategy(body);

    expectHttpStatus(resp, 400);
    expect(resp.data).toEqual(toBeHttpErrorResponse);
  });
});
