import { faker } from '@faker-js/faker';

import { BtStrategy } from '#features/backtesting-strategies/domain/btStrategy.entity.js';
import { randomExchangeName, randomTimeframe } from '#test-utils/domain.js';
import {
  randomNonNegativeFloat,
  randomNonNegativeInt,
  randomPositiveInt,
  randomString,
} from '#test-utils/faker.js';

export function mockBtStrategy(): BtStrategy {
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
    body: randomString(),
    version: randomNonNegativeInt(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  } as BtStrategy;
}
