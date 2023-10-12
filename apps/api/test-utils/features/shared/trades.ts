import { DeepReadonly } from 'ts-essentials';

import { FilledOrder } from '#features/shared/order.js';
import {
  ClosedTrade,
  OpeningTrade,
  TradeId,
  closeTrades,
  createFullOpeningTrade,
} from '#features/shared/trade.js';
import { unsafeUnwrapEitherRight } from '#shared/utils/fp.js';

import {
  mockFilledLimitOrder,
  mockFilledMarketOrder,
  mockFilledStopLimitOrder,
  mockFilledStopMarketOrder,
} from './order.js';

export function mockOpeningTrade(
  entryOrderRequest: DeepReadonly<Extract<FilledOrder, { orderSide: 'ENTRY' }>>,
): OpeningTrade {
  const entryOrder =
    entryOrderRequest.type === 'MARKET'
      ? mockFilledMarketOrder(entryOrderRequest)
      : entryOrderRequest.type === 'LIMIT'
      ? mockFilledLimitOrder(entryOrderRequest)
      : entryOrderRequest.type === 'STOP_MARKET'
      ? mockFilledStopMarketOrder(entryOrderRequest)
      : mockFilledStopLimitOrder(entryOrderRequest);

  return createFullOpeningTrade('yGYz6XiSBS' as TradeId, entryOrder);
}

export function mockClosedTrade(
  entryOrderRequest: DeepReadonly<Extract<FilledOrder, { orderSide: 'ENTRY' }>>,
  exitOrderRequest: DeepReadonly<Extract<FilledOrder, { orderSide: 'EXIT' }>>,
): ClosedTrade {
  const entryOrder =
    entryOrderRequest.type === 'MARKET'
      ? mockFilledMarketOrder(entryOrderRequest)
      : entryOrderRequest.type === 'LIMIT'
      ? mockFilledLimitOrder(entryOrderRequest)
      : entryOrderRequest.type === 'STOP_MARKET'
      ? mockFilledStopMarketOrder(entryOrderRequest)
      : mockFilledStopLimitOrder(entryOrderRequest);
  const exitOrder =
    exitOrderRequest.type === 'MARKET'
      ? mockFilledMarketOrder(exitOrderRequest)
      : exitOrderRequest.type === 'LIMIT'
      ? mockFilledLimitOrder(exitOrderRequest)
      : exitOrderRequest.type === 'STOP_MARKET'
      ? mockFilledStopMarketOrder(exitOrderRequest)
      : mockFilledStopLimitOrder(exitOrderRequest);

  const openingTrade = createFullOpeningTrade('9jNx8NgSCl' as TradeId, entryOrder);
  const { closedTrades } = unsafeUnwrapEitherRight(
    closeTrades({ generateTradeId: () => 'PCtQBEwjj_' as TradeId }, [openingTrade], exitOrder)(),
  );

  return closedTrades[0];
}
