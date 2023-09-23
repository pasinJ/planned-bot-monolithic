import { faker } from '@faker-js/faker';

import { BtExecutionId } from '#features/btStrategies/dataModels/btExecution.js';
import { BtStrategyId, BtStrategyModel, MaxNumKlines } from '#features/btStrategies/dataModels/btStrategy.js';
import { KlineModel } from '#features/btStrategies/dataModels/kline.js';
import { RemoveBrandFromObjVal } from '#shared/utils/types.js';
import { randomBeforeAndAfterDateInPast } from '#test-utils/faker/date.js';
import {
  randomNonNegativeFloat,
  randomNonNegativeInt,
  randomPositiveFloat,
  randomPositiveInt,
} from '#test-utils/faker/number.js';
import { randomString } from '#test-utils/faker/string.js';
import { randomExchangeName, randomLanguage, randomTimeframe } from '#test-utils/features/shared/domain.js';

import { randomSymbolName } from '../symbols/models.js';

export function mockBtStrategy(overrides?: Partial<RemoveBrandFromObjVal<BtStrategyModel>>): BtStrategyModel {
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

export function mockKline(overrides?: Partial<RemoveBrandFromObjVal<KlineModel>>): KlineModel {
  const { before, after } = randomBeforeAndAfterDateInPast();
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

export function randomBtStrategyId() {
  return faker.string.nanoid() as BtStrategyId;
}

export function randomBtExecutionId() {
  return faker.string.nanoid() as BtExecutionId;
}

export function randomMaxKlinesNum() {
  return randomPositiveInt() as MaxNumKlines;
}
