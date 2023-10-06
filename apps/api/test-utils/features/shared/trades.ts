import { dissoc } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { FilledOrder } from '#features/shared/order.js';
import { OpeningTrade, TradeId, createFullOpeningTrade } from '#features/shared/trade.js';
import { Unbrand } from '#shared/utils/types.js';

import { mockFilledMarketOrder } from './order.js';

export function mockOpeningTrade(
  override?: DeepPartial<Unbrand<Extract<FilledOrder, { type: 'MARKET'; orderSide: 'ENTRY' }>>>,
): OpeningTrade {
  const entryOrder = mockFilledMarketOrder({
    orderSide: 'ENTRY',
    quantity: 10,
    fee: { amount: 0.2 },
    filledPrice: 2,
    ...dissoc('orderSide', override ?? {}),
  });

  return createFullOpeningTrade('yGYz6XiSBS' as TradeId, entryOrder);
}
