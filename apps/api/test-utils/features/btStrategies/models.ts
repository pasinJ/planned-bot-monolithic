import { faker } from '@faker-js/faker';

import { BtExecutionId } from '#features/backtesting-strategies/data-models/btExecution.js';
import { BtStrategyModel, MaxNumKlines } from '#features/backtesting-strategies/data-models/btStrategy.js';
import { KlineModel } from '#features/backtesting-strategies/data-models/kline.js';
import { randomExchangeName, randomLanguage, randomTimeframe } from '#test-utils/domain.js';
import {
  randomBeforeAndAfterDate,
  randomNonNegativeFloat,
  randomNonNegativeInt,
  randomPositiveFloat,
  randomPositiveInt,
  randomString,
} from '#test-utils/faker.js';
import { RemoveBrand } from '#test-utils/types.js';

import { randomSymbolName } from '../symbols/models.js';

export function mockBtStrategy(overrides?: Partial<RemoveBrand<BtStrategyModel>>): BtStrategyModel {
  return {
    id: randomString(),
    name: randomString(),
    exchange: randomExchangeName(),
    symbol: randomString(),
    currency: randomString(),
    timeframe: randomTimeframe(),
    initialCapital: randomNonNegativeFloat(),
    takerFeeRate: randomNonNegativeFloat(),
    makerFeeRate: randomNonNegativeFloat(),
    maxNumKlines: randomPositiveInt(),
    startTimestamp: faker.date.soon(),
    endTimestamp: faker.date.future(),
    language: randomLanguage(),
    body: randomString(),
    version: randomNonNegativeInt(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  } as BtStrategyModel;
}

export function mockKline(overrides?: Partial<RemoveBrand<KlineModel>>): KlineModel {
  const { before, after } = randomBeforeAndAfterDate();
  return {
    exchange: randomExchangeName(),
    symbol: randomSymbolName(),
    timeframe: randomTimeframe(),
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
  } as KlineModel;
}

export function randomExecutionId() {
  return faker.string.nanoid() as BtExecutionId;
}

export function randomMaxKlinesNum() {
  return randomPositiveInt() as MaxNumKlines;
}
