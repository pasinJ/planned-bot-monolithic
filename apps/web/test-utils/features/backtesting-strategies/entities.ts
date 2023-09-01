import { faker } from '@faker-js/faker';

import { BtStrategy, BtStrategyId } from '#features/backtesting-strategies/domain/btStrategy.entity';
import { randomExchangeName, randomTimeframe } from '#test-utils/domain';

import { nonNegativeFloat, randomNonNegativeInt, randomPositiveInt, randomString } from '../../faker';

export function mockBtStrategy(overrides?: Partial<BtStrategy>): BtStrategy {
  return {
    id: randomString() as BtStrategyId,
    name: randomString(),
    exchange: randomExchangeName(),
    symbol: faker.string.alpha(6),
    currency: randomString(),
    timeframe: randomTimeframe(),
    initialCapital: nonNegativeFloat(),
    takerFeeRate: nonNegativeFloat(),
    makerFeeRate: nonNegativeFloat(),
    maxNumKlines: randomPositiveInt(),
    startTimestamp: faker.date.soon(),
    endTimestamp: faker.date.future(),
    body: randomString(),
    version: randomNonNegativeInt(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}
