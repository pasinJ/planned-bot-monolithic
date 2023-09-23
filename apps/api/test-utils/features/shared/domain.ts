import { faker } from '@faker-js/faker';
import { includes } from 'ramda';

import { exchangeNameList } from '#features/shared/domain/exchange.js';
import { languageList } from '#features/shared/domain/strategy.js';
import { Timeframe, timeframeList } from '#features/shared/domain/timeframe.js';

export function randomExchangeName() {
  return faker.helpers.arrayElement(exchangeNameList);
}

export function randomTimeframe(include: Timeframe[] = timeframeList) {
  return faker.helpers.arrayElement(timeframeList.filter((t) => includes(t, include)));
}

export function randomTimeframeExclude(exclude: Timeframe[] = []) {
  return faker.helpers.arrayElement(timeframeList.filter((t) => !includes(t, exclude)));
}

export function randomLanguage() {
  return faker.helpers.arrayElement(languageList);
}
