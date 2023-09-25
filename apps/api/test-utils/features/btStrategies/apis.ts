import { faker } from '@faker-js/faker';

import { randomBeforeAndAfterDateInPast } from '#test-utils/faker/date.js';
import { randomPositiveFloat, randomPositiveInt } from '#test-utils/faker/number.js';
import { randomString } from '#test-utils/faker/string.js';
import { randomExchangeName, randomLanguage, randomTimeframe } from '#test-utils/features/shared/domain.js';

export function mockValidAddBtStrategyRequestBody() {
  const { before, after } = randomBeforeAndAfterDateInPast();
  return {
    name: randomString(),
    exchange: randomExchangeName(),
    symbol: randomString(),
    currency: randomString(),
    timeframe: randomTimeframe(),
    maxNumKlines: randomPositiveInt(),
    initialCapital: randomPositiveFloat(),
    takerFeeRate: randomPositiveFloat(),
    makerFeeRate: randomPositiveFloat(),
    startTimestamp: before.toISOString(),
    endTimestamp: after.toISOString(),
    timezone: faker.location.timeZone(),
    language: randomLanguage(),
    body: randomString(),
  };
}
