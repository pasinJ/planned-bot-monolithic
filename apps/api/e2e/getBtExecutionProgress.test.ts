import { toBeHttpErrorResponse } from '#test-utils/expect.js';

import { getBtExecutionProgressById } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

describe('[GIVEN] the execution ID does not exist', () => {
  describe('[WHEN] get backtesting execution progress by ID', () => {
    it('[THEN] it will return HTTP404 and error response body', async () => {
      const executionId = 'IekAhOdDxG';

      const { response } = await getBtExecutionProgressById(executionId);

      expectHttpStatus(response, 404);
      expect(response.data).toEqual(toBeHttpErrorResponse);
    });
  });
});
