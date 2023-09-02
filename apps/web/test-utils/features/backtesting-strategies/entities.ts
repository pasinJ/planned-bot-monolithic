import { faker } from '@faker-js/faker';
import { values } from 'ramda';

import {
  BtStrategy,
  BtStrategyId,
  ExecutionStatus,
  executionStatusEnum,
} from '#features/backtesting-strategies/domain/btStrategy.entity';
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
    executionStatus: randomExecutionStatus(),
    body: randomString(),
    version: randomNonNegativeInt(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}

export function randomExecutionStatus(): ExecutionStatus {
  return faker.helpers.arrayElement(values(executionStatusEnum));
}
