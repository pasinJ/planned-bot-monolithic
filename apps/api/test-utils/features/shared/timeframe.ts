import { faker } from '@faker-js/faker';
import { includes } from 'ramda';

import { Timeframe, timeframeList } from '#features/shared/timeframe.js';

export function _randomTimeframe(include: Timeframe[] = timeframeList) {
  return faker.helpers.arrayElement(timeframeList.filter((t) => includes(t, include)));
}

export function _randomTimeframeExclude(exclude: Timeframe[] = []) {
  return faker.helpers.arrayElement(timeframeList.filter((t) => !includes(t, exclude)));
}
