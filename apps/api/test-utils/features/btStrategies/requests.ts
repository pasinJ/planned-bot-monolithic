import { randomExchangeName, randomTimeframe } from '#test-utils/domain.js';
import {
  anyString,
  randomBeforeAndAfterDate,
  randomNonNegativeInt,
  randomPositiveFloat,
} from '#test-utils/faker.js';

export function mockValidAddBtStrategyRequestBody() {
  const { before, after } = randomBeforeAndAfterDate();
  return {
    name: anyString(),
    exchange: randomExchangeName(),
    symbol: anyString(),
    currency: anyString(),
    timeframe: randomTimeframe(),
    maxNumKlines: randomNonNegativeInt(),
    initialCapital: randomPositiveFloat(),
    takerFeeRate: randomPositiveFloat(),
    makerFeeRate: randomPositiveFloat(),
    startTimestamp: before.toJSON(),
    endTimestamp: after.toJSON(),
    body: anyString(),
  };
}
