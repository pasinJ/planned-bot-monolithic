import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { executeIo } from '#shared/utils/fp.js';
import { mockMainLogger } from '#test-utils/services.js';

import { BnbServiceDeps, buildBnbService } from './service.js';

function mockDeps(overrides?: DeepPartial<BnbServiceDeps>): BnbServiceDeps {
  return mergeDeepRight({ mainLogger: mockMainLogger() }, overrides ?? {}) as BnbServiceDeps;
}

describe('UUT: Build Binance service', () => {
  describe('[WHEN] build Binance service', () => {
    it('[THEN] it will return Right of Binance service', () => {
      const result = executeIo(buildBnbService(mockDeps()));
      expect(result).toEqualRight(expect.toContainAllKeys(['composeWith']));
    });
  });
});
