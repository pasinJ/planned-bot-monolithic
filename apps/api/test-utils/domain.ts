import { faker } from '@faker-js/faker';

import { exchangeNameList } from '#features/shared/domain/exchangeName.js';
import { languageList } from '#features/shared/domain/language.js';
import { timeframeList } from '#features/shared/domain/timeframe.js';

export function randomExchangeName() {
  return faker.helpers.arrayElement(exchangeNameList);
}

export function randomTimeframe() {
  return faker.helpers.arrayElement(timeframeList);
}

export function randomLanguage() {
  return faker.helpers.arrayElement(languageList);
}
