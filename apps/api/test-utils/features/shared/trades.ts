import { faker } from '@faker-js/faker';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { OpeningTrade, TradeId } from '#features/shared/executorModules/trades.js';
import { RemoveBrandFromObjVal } from '#shared/utils/types.js';
import { randomPositiveFloat } from '#test-utils/faker/number.js';

import { mockFilledMarketOrder } from './order.js';

export function randomTradeId(): TradeId {
  return faker.string.nanoid() as TradeId;
}

export function mockOpeningTrade(override?: DeepPartial<RemoveBrandFromObjVal<OpeningTrade>>): OpeningTrade {
  return mergeDeepRight(
    {
      id: randomTradeId(),
      entryOrder: mockFilledMarketOrder(),
      tradeQuantity: randomPositiveFloat(),
      maxDrawdown: randomPositiveFloat(),
      maxRunup: randomPositiveFloat(),
    },
    override ?? {},
  ) as OpeningTrade;
}
