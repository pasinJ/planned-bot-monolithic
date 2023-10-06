import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { OpeningTrade, TradeDrawdown, TradeId, TradeQuantity, TradeRunup } from '#features/shared/trade.js';
import { Unbrand } from '#shared/utils/types.js';

import { mockFilledMarketOrder } from './order.js';

export function mockOpeningTrade(override?: DeepPartial<Unbrand<OpeningTrade>>): OpeningTrade {
  return mergeDeepRight<OpeningTrade, DeepPartial<Unbrand<OpeningTrade>>>(
    {
      id: 'yGYz6XiSBS' as TradeId,
      entryOrder: mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 10, fee: { amount: 0.2 } }),
      tradeQuantity: 9.8 as TradeQuantity,
      maxDrawdown: 0 as TradeDrawdown,
      maxRunup: 0 as TradeRunup,
    },
    override ?? {},
  ) as OpeningTrade;
}
