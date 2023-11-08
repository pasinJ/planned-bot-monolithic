import { wrapLogger } from '#infra/logging.js';
import { executeT } from '#shared/utils/fp.js';
import { mockConsole } from '#test-utils/services.js';

import { getStrategyExecutorConfig } from './config.js';
import { startStrategyExecutor } from './service.js';

describe('UUT: Start strategy executor', () => {
  describe('[WHEN] start strategy executor', () => {
    it('[THEN] it will return Right of strategy executor', async () => {
      const console = mockConsole();
      const deps = {
        isolatedConsole: console,
        loggerIo: wrapLogger(console),
        getConfig: getStrategyExecutorConfig,
      };

      const result = await executeT(startStrategyExecutor(deps));

      expect(result).toEqualRight(expect.toContainAllKeys(['execute', 'stop']));
    });
  });
});
