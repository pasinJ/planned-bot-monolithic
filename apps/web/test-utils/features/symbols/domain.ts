import { Symbol } from '#features/symbols/symbol';
import { randomExchangeName } from '#test-utils/domain';

import { randomString } from '../../faker';

export function mockSymbol(): Symbol {
  const baseAsset = randomString().toUpperCase();
  const quoteAsset = randomString().toUpperCase();

  return {
    name: baseAsset + quoteAsset,
    exchange: randomExchangeName(),
    baseAsset,
    quoteAsset,
  } as Symbol;
}
