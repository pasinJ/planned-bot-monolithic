import { faker } from '@faker-js/faker';
import { DeepPartial } from 'ts-essentials';

import { exchangeNameEnum } from '#features/shared/exchange.js';
import { Kline } from '#features/shared/kline.js';
import { SymbolName } from '#features/shared/symbol.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { Unbrand } from '#shared/utils/types.js';
import { randomBeforeAndAfterDateInPast } from '#test-utils/faker/date.js';
import {
  randomNonNegativeFloat,
  randomNonNegativeInt,
  randomPositiveFloat,
} from '#test-utils/faker/number.js';

import { _randomExchangeName } from './exchange.js';
import { _randomTimeframe } from './timeframe.js';

export function mockKline(overrides?: DeepPartial<Unbrand<Kline>>): Kline {
  return {
    exchange: exchangeNameEnum.BINANCE,
    symbol: 'BNBUSDT',
    timeframe: timeframeEnum['15m'],
    openTimestamp: new Date('2000-01-04'),
    closeTimestamp: new Date('2000-01-05'),
    open: 1.2,
    close: 1.3,
    high: 1.4,
    low: 1.5,
    volume: 0.1,
    quoteAssetVolume: 0.2,
    takerBuyBaseAssetVolume: 0.3,
    takerBuyQuoteAssetVolume: 0.4,
    numTrades: 10,
    ...overrides,
  } as Kline;
}

export function _generateRandomKline(overrides?: Partial<Unbrand<Kline>>): Kline {
  const { before, after } = randomBeforeAndAfterDateInPast();
  return {
    exchange: _randomExchangeName(),
    symbol: faker.string.alpha({ length: 6, casing: 'upper' }) as SymbolName,
    timeframe: _randomTimeframe(),
    openTimestamp: before,
    closeTimestamp: after,
    open: randomPositiveFloat(),
    close: randomPositiveFloat(),
    high: randomPositiveFloat(),
    low: randomPositiveFloat(),
    volume: randomNonNegativeFloat(),
    quoteAssetVolume: randomNonNegativeFloat(),
    takerBuyBaseAssetVolume: randomNonNegativeFloat(),
    takerBuyQuoteAssetVolume: randomNonNegativeFloat(),
    numTrades: randomNonNegativeInt(),
    ...overrides,
  } as Kline;
}
