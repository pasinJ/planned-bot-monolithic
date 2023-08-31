import { faker } from '@faker-js/faker';
import { values } from 'ramda';

import {
  BacktestingStrategy,
  BacktestingStrategyId,
} from '#features/backtesting-strategies/domain/backtestingStrategy.entity';
import { exchangeNameEnum } from '#features/shared/domain/exchange';
import { timeframeEnum } from '#features/shared/domain/timeframe';

import { anyString, nonNegativeFloat, nonNegativeInt, positiveInt } from './faker';

export function mockBacktestingStrategy(overrides?: Partial<BacktestingStrategy>): BacktestingStrategy {
  return {
    id: anyString() as BacktestingStrategyId,
    name: anyString(),
    exchange: faker.helpers.arrayElement(values(exchangeNameEnum)),
    symbol: faker.string.alpha(6),
    currency: anyString(),
    timeframe: faker.helpers.arrayElement(values(timeframeEnum)),
    initialCapital: nonNegativeFloat(),
    takerFeeRate: nonNegativeFloat(),
    makerFeeRate: nonNegativeFloat(),
    maxNumKlines: positiveInt(),
    startTimestamp: faker.date.soon(),
    endTimestamp: faker.date.future(),
    body: anyString(),
    version: nonNegativeInt(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    ...overrides,
  };
}
