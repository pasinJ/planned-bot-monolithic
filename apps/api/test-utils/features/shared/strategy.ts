import { faker } from '@faker-js/faker';

import { languageList } from '#features/shared/strategy.js';

export function _randomLanguage() {
  return faker.helpers.arrayElement(languageList);
}
