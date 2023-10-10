import { wrapLogger } from '#infra/logging.js';
import { executeT } from '#shared/utils/fp.js';

import { buildStrategyExecutor } from './service.js';

describe('UUT: Build strategy executor', () => {
  describe('[WHEN] build strategy executor', () => {
    it('[THEN] it will return Right of strategy executor', async () => {
      const deps = { console, loggerIo: wrapLogger(console) };
      const result = await executeT(buildStrategyExecutor(deps));

      expect(result).toEqualRight(expect.toContainAllKeys(['composeWith', 'stop']));
    });
  });
});
