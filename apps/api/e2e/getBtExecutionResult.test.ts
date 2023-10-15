import { toBeHttpErrorResponse } from '#test-utils/expect.js';

import { getBtExecutionResultById } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

describe('[GIVEN] user sends an empty string as execution ID', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const executionId = '';

      const { response } = await getBtExecutionResultById(executionId);

      expectHttpStatus(response, 400);
      expect(response.data).toEqual(toBeHttpErrorResponse);
    });
  });
});
