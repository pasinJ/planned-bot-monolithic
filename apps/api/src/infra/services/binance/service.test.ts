import { mergeDeepRight } from 'ramda';

import { DeepPartial } from '#shared/helpers.type.js';
import { executeIo } from '#shared/utils/fp.js';
import { mockMainLogger } from '#test-utils/services.js';

import { BnbServiceDeps, buildBnbService } from './service.js';

function mockDeps(overrides?: DeepPartial<BnbServiceDeps>): BnbServiceDeps {
  return mergeDeepRight({ mainLogger: mockMainLogger() }, overrides ?? {}) as BnbServiceDeps;
}

describe('Build Binance service', () => {
  describe('WHEN successfully build Binance service', () => {
    it('THEN it should return Right of Binance service', () => {
      const result = executeIo(buildBnbService(mockDeps()));
      expect(result).toEqualRight(expect.toContainAllKeys(['composeWith']));
    });
  });
});
