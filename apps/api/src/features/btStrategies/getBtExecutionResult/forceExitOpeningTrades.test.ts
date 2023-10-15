import { dissoc, mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { OrderId, generateOrderId } from '#features/shared/order.js';
import { TradeId, generateTradeId } from '#features/shared/trade.js';
import { executeIo } from '#shared/utils/fp.js';
import { mockKline } from '#test-utils/features/shared/kline.js';
import { mockFilledMarketOrder } from '#test-utils/features/shared/order.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategyModule.js';
import { mockOpeningTrade } from '#test-utils/features/shared/trades.js';

import { ForceExitOpeningTradesDeps, forceExitOpeningTrades } from './forceExitOpeningTrades.js';

describe('UUT: Force exit opening trades', () => {
  function mockDeps(override?: DeepPartial<ForceExitOpeningTradesDeps>): ForceExitOpeningTradesDeps {
    return mergeDeepRight<ForceExitOpeningTradesDeps, DeepPartial<ForceExitOpeningTradesDeps>>(
      { generateOrderId, generateTradeId },
      override ?? {},
    );
  }

  let deps: ForceExitOpeningTradesDeps;
  const orderId = 'sCBjEpJGfp' as OrderId;
  const tradeId = 'gMUQYSY5wc' as TradeId;
  const strategyModule = mockStrategyModule({
    takerFeeRate: 1,
    totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0 },
  });
  const orders = {
    openingOrders: [],
    submittedOrders: [],
    triggeredOrders: [],
    filledOrders: [],
    canceledOrders: [],
    rejectedOrders: [],
  };
  const openingTrade = mockOpeningTrade(
    mockFilledMarketOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      filledPrice: 4,
      fee: { amount: 0.1, currency: strategyModule.assetCurrency },
    }),
  );
  const trades = { openingTrades: [openingTrade], closedTrades: [] };
  const lastKline = mockKline({ close: 10 });

  beforeEach(() => {
    deps = mockDeps({ generateOrderId: () => orderId, generateTradeId: () => tradeId });
  });

  describe('[WHEN] force exit opening trades', () => {
    it('[THEN] it will return filled orders list with a new exit order', () => {
      const result = executeIo(forceExitOpeningTrades(deps, strategyModule, orders, trades, lastKline));

      expect(result).toSubsetEqualRight({
        orders: expect.objectContaining({
          filledOrders: expect.arrayContaining([
            {
              id: orderId,
              orderSide: 'EXIT',
              type: 'MARKET',
              quantity: 9.9,
              status: 'FILLED',
              filledPrice: lastKline.close,
              fee: { amount: 0.99, currency: strategyModule.capitalCurrency },
              createdAt: lastKline.closeTimestamp,
              submittedAt: lastKline.closeTimestamp,
              filledAt: lastKline.closeTimestamp,
            },
          ]),
        }),
      });
    });
    it('[THEN] it will return unchanged opening, triggered, submitted, canceled, and rejected orders lists', () => {
      const result = executeIo(forceExitOpeningTrades(deps, strategyModule, orders, trades, lastKline));

      expect(result).toSubsetEqualRight({
        orders: expect.objectContaining({
          openingOrders: orders.openingOrders,
          triggeredOrders: orders.triggeredOrders,
          submittedOrders: orders.submittedOrders,
          canceledOrders: orders.canceledOrders,
          rejectedOrders: orders.rejectedOrders,
        }),
      });
    });
    it('[THEN] it will return closed trades list with a new closed trade', () => {
      const result = executeIo(forceExitOpeningTrades(deps, strategyModule, orders, trades, lastKline));

      const exitOrder = {
        id: orderId,
        orderSide: 'EXIT',
        type: 'MARKET',
        quantity: 9.9,
        status: 'FILLED',
        filledPrice: lastKline.close,
        fee: { amount: 0.99, currency: strategyModule.capitalCurrency },
        createdAt: lastKline.closeTimestamp,
        submittedAt: lastKline.closeTimestamp,
        filledAt: lastKline.closeTimestamp,
      };
      expect(result).toSubsetEqualRight({
        trades: expect.objectContaining({
          closedTrades: expect.arrayContaining([
            {
              ...dissoc('unrealizedReturn', openingTrade),
              exitOrder,
              maxRunup: 59.4,
              maxPrice: lastKline.close,
              netReturn: 58.01,
            },
          ]),
        }),
      });
    });
    it('[THEN] it will return unchanged opening trades list', () => {
      const result = executeIo(forceExitOpeningTrades(deps, strategyModule, orders, trades, lastKline));

      expect(result).toSubsetEqualRight({
        trades: expect.objectContaining({ openingTrades: trades.openingTrades }),
      });
    });
    it('[THEN] it will return strategy with updated strategy module', () => {
      const result = executeIo(forceExitOpeningTrades(deps, strategyModule, orders, trades, lastKline));

      expect(result).toSubsetEqualRight({
        strategyModule: {
          ...strategyModule,
          equity: 10057.01,
          openReturn: 0,
          netReturn: 58.01,
          netProfit: 58.01,
          netLoss: 0,
          totalFees: { inCapitalCurrency: 0.99, inAssetCurrency: 0 },
        },
      });
    });
  });
});
