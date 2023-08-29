import { faker } from '@faker-js/faker';
import { values } from 'ramda';

import {
  BacktestingStrategy,
  BacktestingStrategyId,
} from '#features/backtesting-strategies/domain/backtestingStrategy.entity';
import { exchangeEnum } from '#features/shared/domain/exchange';

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
