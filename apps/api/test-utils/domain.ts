import { faker } from '@faker-js/faker';
import { values } from 'ramda';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange.js';
import { timeframeEnum } from '#shared/domain/timeframe.js';

export function randomExchangeName() {
  return faker.helpers.arrayElement(values(exchangeNameEnum));
}

export function randomTimeframe() {
  return faker.helpers.arrayElement(values(timeframeEnum));
}