import { faker } from '@faker-js/faker';

import { BtStrategy } from '#features/backtesting-strategies/domain/btStrategy.entity.js';
import { randomExchangeName, randomTimeframe } from '#test-utils/domain.js';
import {
  anyString,
  randomNonNegativeFloat,
  randomNonNegativeInt,
  randomPositiveInt,
} from '#test-utils/faker.js';

export function mockBtStrategy(): BtStrategy {
  return {
    id: anyString(),
    name: anyString(),
    exchange: randomExchangeName(),
    symbol: anyString(),
    currency: anyString(),
    timeframe: randomTimeframe(),
    initialCapital: randomNonNegativeFloat(),
    takerFeeRate: randomNonNegativeFloat(),
    makerFeeRate: randomNonNegativeFloat(),
    maxNumKlines: randomPositiveInt(),
    startTimestamp: faker.date.soon(),
    endTimestamp: faker.date.future(),
    body: anyString(),
    version: randomNonNegativeInt(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
}
