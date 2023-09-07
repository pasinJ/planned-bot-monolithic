import { randomExchangeName, randomLanguage, randomTimeframe } from '#test-utils/domain.js';
import {
  randomBeforeAndAfterDate,
  randomPositiveFloat,
  randomPositiveInt,
  randomString,
} from '#test-utils/faker.js';

export function mockValidAddBtStrategyRequestBody() {
  const { before, after } = randomBeforeAndAfterDate();
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
    startTimestamp: before.toJSON(),
    endTimestamp: after.toJSON(),
    language: randomLanguage(),
    body: randomString(),
  };
}
