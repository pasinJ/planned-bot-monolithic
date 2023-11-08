import { faker } from '@faker-js/faker';

import { exchangeNameList } from '#features/shared/exchange.js';

export function _randomExchangeName() {
  return faker.helpers.arrayElement(exchangeNameList);
}
