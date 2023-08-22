import { faker } from '@faker-js/faker';

import { DateService } from '#infra/services/dateService.type.js';
import { IdService } from '#infra/services/idService.type.js';

export function mockDateService(): DateService {
  return { getCurrentDate: () => faker.date.recent() };
}

export function mockIdService(): IdService {
  return { generateSymbolId: () => faker.string.nanoid() } as IdService;
}
