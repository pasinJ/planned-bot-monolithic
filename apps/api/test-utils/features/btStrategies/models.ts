import { faker } from '@faker-js/faker';

import { BtStrategyModel } from '#features/backtesting-strategies/data-models/btStrategy.model.js';
import { randomExchangeName, randomLanguage, randomTimeframe } from '#test-utils/domain.js';
import {
  randomNonNegativeFloat,
  randomNonNegativeInt,
  randomPositiveInt,
  randomString,
} from '#test-utils/faker.js';
import { RemoveBrand } from '#test-utils/types.js';

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
