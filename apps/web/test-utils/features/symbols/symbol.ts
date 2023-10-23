import { exchangeNameEnum } from '#features/exchanges/exchange';
import { Symbol } from '#features/symbols/symbol';

import { randomString } from '../../faker';

export function mockSymbol(): Symbol {
  const baseAsset = randomString().toUpperCase();
  const quoteAsset = randomString().toUpperCase();

  return {
    name: baseAsset + quoteAsset,
    exchange: exchangeNameEnum.BINANCE,
    baseAsset,
    quoteAsset,
  } as Symbol;
}
