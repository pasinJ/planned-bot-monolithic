import { faker } from '@faker-js/faker';
import { values } from 'ramda';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange';
import { languageEnum } from '#shared/domain/language';
import { timeframeEnum } from '#shared/domain/timeframe';

export function randomExchangeName() {
  return faker.helpers.arrayElement(values(exchangeNameEnum));
}

export function randomTimeframe() {
  return faker.helpers.arrayElement(values(timeframeEnum));
}

export function randomLanguage() {
  return faker.helpers.arrayElement(values(languageEnum));
}
