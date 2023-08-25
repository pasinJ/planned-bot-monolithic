import { faker } from '@faker-js/faker';
import { values } from 'ramda';

import {
  BacktestingStrategy,
  BacktestingStrategyId,
  exchangeEnum,
} from '#features/backtesting-strategy/domain/backtestingStrategy.entity';

import { anyString, nonNegativeFloat, nonNegativeInt, positiveInt } from './faker';

export function mockBacktestingStrategy(): BacktestingStrategy {
  return {
    id: anyString() as BacktestingStrategyId,
    name: anyString(),
    exchange: faker.helpers.arrayElement(values(exchangeEnum)),
    currency: anyString(),
    takerFeeRate: nonNegativeFloat(),
    makerFeeRate: nonNegativeFloat(),
    maxNumLastKline: positiveInt(),
    body: anyString(),
    version: nonNegativeInt(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
  };
}
