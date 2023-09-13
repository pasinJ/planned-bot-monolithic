import { faker } from '@faker-js/faker';
import { values } from 'ramda';

import {
  BtStrategy,
  ExecutionStatus,
  executionStatusEnum,
} from '#features/backtesting-strategies/domain/btStrategy.entity.js';
import { randomExchangeName, randomLanguage, randomTimeframe } from '#test-utils/domain.js';
import {
  randomNonNegativeFloat,
  randomNonNegativeInt,
  randomPositiveInt,
  randomString,
} from '#test-utils/faker.js';
import { RemoveBrand } from '#test-utils/types.js';

export function mockBtStrategy(overrides?: Partial<RemoveBrand<BtStrategy>>): BtStrategy {
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
    executionStatus: randomExecutionStatus(),
    language: randomLanguage(),
    body: randomString(),
    version: randomNonNegativeInt(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  } as BtStrategy;
}

export function randomExecutionStatus(): ExecutionStatus {
  return faker.helpers.arrayElement(values(executionStatusEnum));
}
