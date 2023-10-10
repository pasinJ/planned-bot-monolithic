import { dissoc, mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { Price } from '#features/shared/kline.js';
import { TradeId } from '#features/shared/trade.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeIo } from '#shared/utils/fp.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import {
  mockFilledMarketOrder,
  mockOpeningLimitOrder,
  mockPendingCancelOrder,
  mockPendingLimitOrder,
  mockPendingMarketOrder,
  mockPendingStopLimitOrder,
  mockPendingStopMarketOrder,
  mockTriggeredOrder,
} from '#test-utils/features/shared/order.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategyModule.js';
import { mockOpeningTrade } from '#test-utils/features/shared/trades.js';

import {
  ProcessOrdersDeps,
  ProcessPendingLimitOrderDeps,
  ProcessPendingMarketOrderDeps,
  ProcessPendingStopLimitOrderDeps,
  ProcessPendingStopMarketOrderDeps,
  processPendingCancelOrder,
  processPendingLimitOrder,
  processPendingMarketOrder,
  processPendingOrders,
  processPendingStopLimitOrder,
  processPendingStopMarketOrder,
} from './processPendingOrders.js';

describe('UUT: Process pending MARKET order', () => {
  function mockDeps(overrides?: DeepPartial<ProcessPendingMarketOrderDeps>): ProcessPendingMarketOrderDeps {
    return mergeDeepRight(
      {
        dateService: { getCurrentDate: () => new Date('2010-01-08') as ValidDate },
        generateTradeId: () => 'Px05r9ahU3' as TradeId,
      },
      overrides ?? {},
    );
  }
  const defaultOrders = { filledOrders: [], rejectedOrders: [] };
  const defaultTrades = { openingTrades: [], closedTrades: [] };
  const defaultCurrentPrice = 10 as Price;

  describe('[GIVEN] the order is a valid entry MARKET order', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const tradeId = 'zuu-T50nM6' as TradeId;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['MARKET'] }),
      takerFeeRate: 2,
      totalCapital: 1000,
      availableCapital: 1000,
      totalAssetQuantity: 100,
      availableAssetQuantity: 100,
      totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0 },
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const marketOrder = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });
    const currentPrice = 10 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate }, generateTradeId: () => tradeId });
    });

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return filled orders list with the order be filled', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toContainEqual({
          ...marketOrder,
          status: 'FILLED',
          filledPrice: currentPrice,
          fee: { amount: 0.2, currency: strategyModule.assetCurrency },
          submittedAt: currentDate,
          filledAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged rejected orders list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return opening trades list with a new opening trade', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.trades.openingTrades).toContainEqual({
          id: tradeId,
          entryOrder: {
            ...marketOrder,
            status: 'FILLED',
            filledPrice: currentPrice,
            fee: { amount: 0.2, currency: strategyModule.assetCurrency },
            submittedAt: currentDate,
            filledAt: currentDate,
          },
          tradeQuantity: 9.8,
          maxDrawdown: 0,
          minPrice: currentPrice,
          maxRunup: 0,
          maxPrice: currentPrice,
          unrealizedReturn: 0,
        });
      });
      it('[THEN] it will return unchanged closed trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.trades.closedTrades).toEqual(trades.closedTrades);
      });
      it('[THEN] it will return strategy with updated strategy module', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          totalCapital: 900,
          availableCapital: 900,
          totalAssetQuantity: 109.8,
          availableAssetQuantity: 109.8,
          totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0.2 },
        });
      });
    });
  });
  describe('[GIVEN] the order is a valid entry MARKET order [BUT] strategy does not has enough available capital', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['MARKET'] }),
      availableCapital: 50,
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const marketOrder = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });
    const currentPrice = 10 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...marketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });

  describe('[GIVEN] the order is a valid exit MARKET order [AND] has enough opening trade quantity', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-02-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['MARKET'] }),
      takerFeeRate: 2,
      totalCapital: 1000,
      availableCapital: 1000,
      totalAssetQuantity: 100.9,
      availableAssetQuantity: 100.9,
      totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0 },
    });
    const orders = defaultOrders;
    const openingTrade = mockOpeningTrade(
      mockFilledMarketOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        filledPrice: 4,
        fee: { amount: 0.1, currency: strategyModule.assetCurrency },
      }),
    );
    const trades = { ...defaultTrades, openingTrades: [openingTrade] };
    const marketOrder = mockPendingMarketOrder({ orderSide: 'EXIT', quantity: 9.9 });
    const currentPrice = 5 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return filled orders list with the order be filled', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toContainEqual({
          ...marketOrder,
          status: 'FILLED',
          filledPrice: currentPrice,
          fee: { amount: 0.99, currency: strategyModule.capitalCurrency },
          submittedAt: currentDate,
          filledAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged rejected orders list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return closed trades list with a new closed trade', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.trades.closedTrades).toContainEqual({
          ...dissoc('unrealizedReturn', openingTrade),
          exitOrder: {
            ...marketOrder,
            status: 'FILLED',
            filledPrice: currentPrice,
            fee: { amount: 0.99, currency: strategyModule.capitalCurrency },
            submittedAt: currentDate,
            filledAt: currentDate,
          },
          maxRunup: 9.9,
          maxPrice: currentPrice,
          netReturn: 8.51,
        });
      });
      it('[THEN] it will return opening trades list without the matching opening trade', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.trades.openingTrades).toEqual([]);
      });
      it('[THEN] it will return strategy with updated strategy module', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          totalCapital: 1048.51,
          availableCapital: 1048.51,
          totalAssetQuantity: 91,
          availableAssetQuantity: 91,
          totalFees: { inCapitalCurrency: 0.99, inAssetCurrency: 0 },
        });
      });
    });
  });
  describe('[GIVEN] the order is a valid exit MARKET order [AND] does not have enough opening trade quantity', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-02-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['MARKET'] }),
      takerFeeRate: 2,
      totalCapital: 1000,
      availableCapital: 1000,
      totalAssetQuantity: 100.9,
      availableAssetQuantity: 100.9,
      totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0 },
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const marketOrder = mockPendingMarketOrder({ orderSide: 'EXIT', quantity: 10 });
    const currentPrice = 5 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...marketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order is a valid exit MARKET order [AND] strategy does not have enough available asset quantity', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-02-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['MARKET'] }),
      takerFeeRate: 2,
      totalCapital: 1000,
      availableCapital: 1000,
      totalAssetQuantity: 100.9,
      availableAssetQuantity: 5,
      totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0 },
    });
    const orders = defaultOrders;
    const openingTrade = mockOpeningTrade(
      mockFilledMarketOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        filledPrice: 4,
        fee: { amount: 0.1, currency: strategyModule.assetCurrency },
      }),
    );
    const trades = { ...defaultTrades, openingTrades: [openingTrade] };
    const marketOrder = mockPendingMarketOrder({ orderSide: 'EXIT', quantity: 9.9 });
    const currentPrice = 5 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...marketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });

  describe('[GIVEN] the order is a valid MARKET order [BUT] the MARKET order type is not allowed', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({ symbol: mockBnbSymbol({ orderTypes: [] }) });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const marketOrder = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });
    const currentPrice = defaultCurrentPrice;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...marketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid quantity', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({
        orderTypes: ['MARKET'],
        filters: [{ type: 'MARKET_LOT_SIZE', minQty: 1, maxQty: 10, stepSize: 0.1 }],
      }),
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const marketOrder = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 0.5 });
    const currentPrice = defaultCurrentPrice;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...marketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid notional', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({
        orderTypes: ['MARKET'],
        filters: [{ type: 'MIN_NOTIONAL', minNotional: 5, applyToMarket: true, avgPriceMins: 0 }],
      }),
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const marketOrder = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 2 });
    const currentPrice = 2 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...marketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingMarketOrder(deps, strategyModule, orders, trades, marketOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
});

describe('UUT: Process pending LIMIT order', () => {
  function mockDeps(overrides?: DeepPartial<ProcessPendingLimitOrderDeps>): ProcessPendingLimitOrderDeps {
    return mergeDeepRight(
      {
        dateService: { getCurrentDate: () => new Date('2010-01-08') as ValidDate },
        generateTradeId: () => 'Px05r9ahU3' as TradeId,
      },
      overrides ?? {},
    );
  }

  const defaultOrders = { openingOrders: [], filledOrders: [], rejectedOrders: [] };
  const defaultTrades = { openingTrades: [], closedTrades: [] };

  describe('[GIVEN] the order is a valid entry LIMIT order [AND] the limit price is less than the current price', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['LIMIT'] }),
      makerFeeRate: 1,
      availableCapital: 100,
      inOrdersCapital: 100,
      totalAssetQuantity: 100,
      availableAssetQuantity: 100,
      totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0 },
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const limitOrder = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
    const currentPrice = 10 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return opening orders list with the order be opened', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.openingOrders).toContainEqual({
          ...limitOrder,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged filled and rejected orders lists', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades lists', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          availableCapital: 50,
          inOrdersCapital: 150,
        });
      });
    });
  });
  describe('[GIVEN] the order is a valid entry LIMIT order [AND] the limit price is greater than or equal to the current price', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const tradeId = 'gHrQH_QA5Z' as TradeId;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['MARKET'] }),
      takerFeeRate: 1,
      totalCapital: 100,
      availableCapital: 100,
      totalAssetQuantity: 100,
      availableAssetQuantity: 100,
      totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0 },
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const limitOrder = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
    const currentPrice = 4 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate }, generateTradeId: () => tradeId });
    });

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return filled orders list with the order be filled', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toContainEqual({
          ...limitOrder,
          status: 'FILLED',
          filledPrice: currentPrice,
          fee: { amount: 0.1, currency: strategyModule.assetCurrency },
          submittedAt: currentDate,
          filledAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening and rejected orders lists', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return opening trades list with a new opening trade', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades.openingTrades).toContainEqual({
          id: tradeId,
          entryOrder: {
            ...limitOrder,
            status: 'FILLED',
            filledPrice: currentPrice,
            fee: { amount: 0.1, currency: strategyModule.assetCurrency },
            submittedAt: currentDate,
            filledAt: currentDate,
          },
          tradeQuantity: 9.9,
          maxDrawdown: 0,
          minPrice: currentPrice,
          maxRunup: 0,
          maxPrice: currentPrice,
          unrealizedReturn: 0,
        });
      });
      it('[THEN] it will return unchanged closed trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades.closedTrades).toEqual(trades.closedTrades);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          totalCapital: 60,
          availableCapital: 60,
          totalAssetQuantity: 109.9,
          availableAssetQuantity: 109.9,
          totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0.1 },
        });
      });
    });
  });
  describe('[GIVEN] the order is a valid entry LIMIT order [BUT] strategy does not has enough available capital', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['LIMIT'] }),
      availableCapital: 40,
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const limitOrder = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
    const currentPrice = 10 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...limitOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });

  describe('[GIVEN] the order is a valid exit LIMIT order [AND] the limit price is greater than the current price', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['LIMIT'] }),
      inOrdersAssetQuantity: 100,
      availableAssetQuantity: 100,
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const limitOrder = mockPendingLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 5 });
    const currentPrice = 4 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return opening orders list with the order be opened', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.openingOrders).toContainEqual({
          ...limitOrder,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged filled and rejected orders lists', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades lists', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersAssetQuantity: 110,
          availableAssetQuantity: 90,
        });
      });
    });
  });
  describe('[GIVEN] the order is a valid exit LIMIT order [AND] the limit price is less than or equal to the current price', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['MARKET'] }),
      takerFeeRate: 1,
      totalCapital: 100,
      availableCapital: 100,
      totalAssetQuantity: 100,
      availableAssetQuantity: 100,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const orders = defaultOrders;
    const openingTrade = mockOpeningTrade(
      mockFilledMarketOrder({
        orderSide: 'ENTRY',
        quantity: 10.1,
        filledPrice: 4,
        fee: { amount: 0.1, currency: strategyModule.assetCurrency },
      }),
    );
    const trades = { ...defaultTrades, openingTrades: [openingTrade] };
    const limitOrder = mockPendingLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 5 });
    const currentPrice = 10 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return filled orders list with the filled MARKET order', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toContainEqual({
          ...limitOrder,
          status: 'FILLED',
          filledPrice: currentPrice,
          fee: { amount: 1, currency: strategyModule.capitalCurrency },
          submittedAt: currentDate,
          filledAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening and rejected orders lists', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return opening trades list without the matching opening trade', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades.openingTrades).not.toContainEqual(openingTrade);
      });
      it('[THEN] it will return closed trades list with the matching opening trade', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades.closedTrades).toContainEqual({
          ...dissoc('unrealizedReturn', openingTrade),
          exitOrder: {
            ...limitOrder,
            status: 'FILLED',
            filledPrice: currentPrice,
            fee: { amount: 1, currency: strategyModule.capitalCurrency },
            submittedAt: currentDate,
            filledAt: currentDate,
          },
          maxPrice: currentPrice,
          maxRunup: 60,
          netReturn: 58.6,
        });
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          totalCapital: 199,
          availableCapital: 199,
          totalAssetQuantity: 90,
          availableAssetQuantity: 90,
          totalFees: { inCapitalCurrency: 2, inAssetCurrency: 1 },
        });
      });
    });
  });
  describe('[GIVEN] the order is an entry LIMIT order [BUT] strategy does not has enough available asset quantity', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['LIMIT'] }),
      availableAssetQuantity: 5,
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const limitOrder = mockPendingLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 5 });
    const currentPrice = 4 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...limitOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });

  describe('[GIVEN] the order is a valid LIMIT order [BUT] the LIMIT order type is not allowed', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({ symbol: mockBnbSymbol({ orderTypes: [] }) });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const limitOrder = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
    const currentPrice = 10 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...limitOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid quantity', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({ symbol: mockBnbSymbol({ orderTypes: ['LIMIT'] }) });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const limitOrder = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: -1, limitPrice: 5 });
    const currentPrice = 10 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...limitOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid limit price', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({
        orderTypes: ['LIMIT'],
        filters: [{ type: 'PRICE_FILTER', minPrice: 10, maxPrice: 20, tickSize: 0.1 }],
      }),
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const limitOrder = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
    const currentPrice = 10 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...limitOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid notional', () => {
    let deps: ProcessPendingMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({
        orderTypes: ['LIMIT'],
        filters: [{ type: 'MIN_NOTIONAL', minNotional: 60, avgPriceMins: 5, applyToMarket: false }],
      }),
    });
    const orders = defaultOrders;
    const trades = defaultTrades;
    const limitOrder = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
    const currentPrice = 10 as Price;

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...limitOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged filled trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.trades).toEqual(trades);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentPrice),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
});

describe('UUT: Process pending STOP_MARKET order', () => {
  function mockDeps(
    overrides?: DeepPartial<ProcessPendingStopMarketOrderDeps>,
  ): ProcessPendingStopMarketOrderDeps {
    return mergeDeepRight(
      { dateService: { getCurrentDate: () => new Date('2011-11-11') as ValidDate } },
      overrides ?? {},
    );
  }

  const defaultOrders = { openingOrders: [], rejectedOrders: [] };

  describe('[GIVEN] the order is a valid entry STOP_MARKET order', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['STOP_MARKET'] }),
      availableCapital: 500,
      inOrdersCapital: 500,
    });
    const orders = defaultOrders;
    const stopMarketOrder = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return opening orders list with the order in opening state', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.openingOrders).toContainEqual({
          ...stopMarketOrder,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged rejected orders list', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersCapital: 620,
          availableCapital: 380,
        });
      });
    });
  });
  describe('[GIVEN] the order is a entry STOP_MARKET order [BUT] strategy does not has enough available capital', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['STOP_MARKET'] }),
      availableCapital: 100,
    });
    const orders = defaultOrders;
    const stopMarketOrder = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopMarketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged opening trades list', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });

  describe('[GIVEN] the order is a valid exit STOP_MARKET order', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['STOP_MARKET'] }),
      inOrdersAssetQuantity: 10,
      availableAssetQuantity: 50,
    });
    const orders = defaultOrders;
    const stopMarketOrder = mockPendingStopMarketOrder({ orderSide: 'EXIT', quantity: 10, stopPrice: 5 });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return opening orders list with the order in opening state', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.openingOrders).toContainEqual({
          ...stopMarketOrder,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged rejected orders list', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersAssetQuantity: 20,
          availableAssetQuantity: 40,
        });
      });
    });
  });
  describe('[GIVEN] the order is a valid exit STOP_MARKET order [BUT] strategy does not has enough available asset quantity', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['STOP_MARKET'] }),
      availableAssetQuantity: 5,
    });
    const orders = defaultOrders;
    const stopMarketOrder = mockPendingStopMarketOrder({ orderSide: 'EXIT', quantity: 10, stopPrice: 5 });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopMarketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged opening trades list', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });

  describe('[GIVEN] the order is a STOP_MARKET order [BUT] the STOP_MARKET order type is not allowed', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({ symbol: mockBnbSymbol({ orderTypes: [] }) });
    const orders = defaultOrders;
    const stopMarketOrder = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopMarketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged opening trades list', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid quantity', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({
        orderTypes: ['STOP_MARKET'],
        filters: [{ type: 'LOT_SIZE', minQty: 20, maxQty: 100, stepSize: 0.1 }],
      }),
    });
    const orders = defaultOrders;
    const stopMarketOrder = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopMarketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged opening trades list', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid stop price', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({
        orderTypes: ['STOP_MARKET'],
        filters: [{ type: 'PRICE_FILTER', minPrice: 20, maxPrice: 100, tickSize: 0.1 }],
      }),
    });
    const orders = defaultOrders;
    const stopMarketOrder = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopMarketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged opening trades list', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid notional', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({
        orderTypes: ['STOP_MARKET'],
        filters: [{ type: 'MIN_NOTIONAL', minNotional: 200, applyToMarket: false, avgPriceMins: 5 }],
      }),
    });
    const orders = defaultOrders;
    const stopMarketOrder = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopMarketOrder,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
      it('[THEN] it will return unchanged opening trades list', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(
          processPendingStopMarketOrder(deps, strategyModule, orders, stopMarketOrder),
        );

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
});

describe('UUT: Process pending STOP_LIMIT order', () => {
  function mockDeps(
    overrides?: DeepPartial<ProcessPendingStopLimitOrderDeps>,
  ): ProcessPendingStopLimitOrderDeps {
    return mergeDeepRight(
      { dateService: { getCurrentDate: () => new Date('2011-11-11') as ValidDate } },
      overrides ?? {},
    );
  }

  const defaultOrders = { openingOrders: [], rejectedOrders: [] };

  describe('[GIVEN] the order is a valid entry STOP_LIMIT order', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['STOP_LIMIT'] }),
      inOrdersCapital: 500,
      availableCapital: 500,
    });
    const orders = defaultOrders;
    const stopLimitOrder = mockPendingStopLimitOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      stopPrice: 12,
      limitPrice: 15,
    });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return opening orders list with the order in opening state', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.openingOrders).toContainEqual({
          ...stopLimitOrder,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged rejected orders list', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersCapital: 650,
          availableCapital: 350,
        });
      });
    });
  });
  describe('[GIVEN] the order is a entry STOP_LIMIT order [BUT] strategy does not has enough available capital', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['STOP_LIMIT'] }),
      availableCapital: 100,
    });
    const orders = defaultOrders;
    const stopLimitOrder = mockPendingStopLimitOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      stopPrice: 12,
      limitPrice: 15,
    });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopLimitOrder,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening orders list', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });

  describe('[GIVEN] the order is a valid exit STOP_LIMIT order', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['STOP_LIMIT'] }),
      inOrdersAssetQuantity: 5,
      availableAssetQuantity: 20,
    });
    const orders = defaultOrders;
    const stopLimitOrder = mockPendingStopLimitOrder({
      orderSide: 'EXIT',
      quantity: 10,
      stopPrice: 12,
      limitPrice: 15,
    });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return opening orders list with the order in opening state', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.openingOrders).toContainEqual({
          ...stopLimitOrder,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged rejected orders list', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersAssetQuantity: 15,
          availableAssetQuantity: 10,
        });
      });
    });
  });
  describe('[GIVEN] the order is a exit STOP_LIMIT order [BUT] strategy does not has enough available capital', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({ orderTypes: ['STOP_LIMIT'] }),
      availableAssetQuantity: 9,
    });
    const orders = defaultOrders;
    const stopLimitOrder = mockPendingStopLimitOrder({
      orderSide: 'EXIT',
      quantity: 10,
      stopPrice: 12,
      limitPrice: 15,
    });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopLimitOrder,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening orders list', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });

  describe('[GIVEN] the order is an entry STOP_LIMIT order [BUT] the STOP_LIMIT order type is not allowed', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({ symbol: mockBnbSymbol({ orderTypes: [] }) });
    const orders = defaultOrders;
    const stopLimitOrder = mockPendingStopLimitOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      stopPrice: 12,
      limitPrice: 15,
    });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopLimitOrder,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening orders list', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid quantity', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({
        orderTypes: ['STOP_LIMIT'],
        filters: [{ type: 'LOT_SIZE', minQty: 15, maxQty: 20, stepSize: 0.1 }],
      }),
    });
    const orders = defaultOrders;
    const stopLimitOrder = mockPendingStopLimitOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      stopPrice: 12,
      limitPrice: 15,
    });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopLimitOrder,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening orders list', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid stop price', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({ symbol: mockBnbSymbol({ orderTypes: ['STOP_LIMIT'] }) });
    const orders = defaultOrders;
    const stopLimitOrder = mockPendingStopLimitOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      stopPrice: 0,
      limitPrice: 15,
    });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopLimitOrder,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening orders list', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid limit price', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({ symbol: mockBnbSymbol({ orderTypes: ['STOP_LIMIT'] }) });
    const orders = defaultOrders;
    const stopLimitOrder = mockPendingStopLimitOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      stopPrice: 12,
      limitPrice: -1,
    });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopLimitOrder,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening orders list', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
  describe('[GIVEN] the order has invalid notional', () => {
    let deps: ProcessPendingStopMarketOrderDeps;
    const currentDate = new Date('2010-03-05') as ValidDate;
    const strategyModule = mockStrategyModule({
      symbol: mockBnbSymbol({
        orderTypes: ['STOP_LIMIT'],
        filters: [{ type: 'MIN_NOTIONAL', minNotional: 200, applyToMarket: false, avgPriceMins: 5 }],
      }),
    });
    const orders = defaultOrders;
    const stopLimitOrder = mockPendingStopLimitOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      stopPrice: 12,
      limitPrice: 15,
    });

    beforeEach(() => {
      deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    });

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...stopLimitOrder,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening orders list', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
      });
      it('[THEN] it will return unchanged strategy module', () => {
        const result = executeIo(processPendingStopLimitOrder(deps, strategyModule, orders, stopLimitOrder));

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
});

describe('UUT: Process pending CANCEL order', () => {
  describe('[GIVEN] there is a opening entry order with order ID that matches the cancel order', () => {
    const currentDate = new Date('2022-06-12') as ValidDate;
    const deps = { dateService: { getCurrentDate: () => currentDate } };

    const strategyModule = mockStrategyModule({ inOrdersCapital: 200, availableCapital: 500 });

    const openingOrder = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 5, limitPrice: 10 });
    const cancelOrder = mockPendingCancelOrder({ orderIdToCancel: openingOrder.id });
    const orders = {
      openingOrders: [openingOrder],
      triggeredOrders: [],
      submittedOrders: [],
      canceledOrders: [],
      rejectedOrders: [],
    };

    describe('[WHEN] process pending CANCEL order', () => {
      it('[THEN] it will return opening orders list without the opening order', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.openingOrders).not.toContainEqual(openingOrder);
      });
      it('[THEN] it will return canceled orders list with the opening order be canceled', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.canceledOrders).toContainEqual({
          ...openingOrder,
          status: 'CANCELED',
          canceledAt: currentDate,
        });
      });
      it('[THEN] it will return submitted orders list with the cancel order be summited', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.submittedOrders).toContainEqual({
          ...cancelOrder,
          status: 'SUBMITTED',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged triggered and rejected orders lists', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.rejectedOrders).not.toContainEqual(orders.rejectedOrders);
        expect(result.orders.triggeredOrders).not.toContainEqual(orders.triggeredOrders);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersCapital: 150,
          availableCapital: 550,
        });
      });
    });
  });

  describe('[GIVEN] there is a opening exit order with order ID that matches the cancel order', () => {
    const currentDate = new Date('2022-06-12') as ValidDate;
    const deps = { dateService: { getCurrentDate: () => currentDate } };

    const strategyModule = mockStrategyModule({ inOrdersAssetQuantity: 12, availableAssetQuantity: 20 });

    const openingOrder = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 5 });
    const cancelOrder = mockPendingCancelOrder({ orderIdToCancel: openingOrder.id });
    const orders = {
      openingOrders: [openingOrder],
      triggeredOrders: [],
      submittedOrders: [],
      canceledOrders: [],
      rejectedOrders: [],
    };

    describe('[WHEN] process pending CANCEL order', () => {
      it('[THEN] it will return opening orders list without the opening order', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.openingOrders).not.toContainEqual(openingOrder);
      });
      it('[THEN] it will return canceled orders list with the opening order be canceled', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.canceledOrders).toContainEqual({
          ...openingOrder,
          status: 'CANCELED',
          canceledAt: currentDate,
        });
      });
      it('[THEN] it will return submitted orders list with the cancel order be summited', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.submittedOrders).toContainEqual({
          ...cancelOrder,
          status: 'SUBMITTED',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged triggered and rejected orders lists', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.rejectedOrders).not.toContainEqual(orders.rejectedOrders);
        expect(result.orders.triggeredOrders).not.toContainEqual(orders.triggeredOrders);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersAssetQuantity: 7,
          availableAssetQuantity: 25,
        });
      });
    });
  });

  describe('[GIVEN] there is a triggered entry order with order ID that matches the cancel order', () => {
    const currentDate = new Date('2022-06-12') as ValidDate;
    const deps = { dateService: { getCurrentDate: () => currentDate } };

    const strategyModule = mockStrategyModule({ inOrdersCapital: 200, availableCapital: 500 });

    const triggeredOrder = mockTriggeredOrder({
      orderSide: 'ENTRY',
      quantity: 5,
      limitPrice: 10,
      stopPrice: 5,
    });
    const cancelOrder = mockPendingCancelOrder({ orderIdToCancel: triggeredOrder.id });
    const orders = {
      openingOrders: [],
      triggeredOrders: [triggeredOrder],
      submittedOrders: [],
      canceledOrders: [],
      rejectedOrders: [],
    };

    describe('[WHEN] process pending CANCEL order', () => {
      it('[THEN] it will return triggered orders list without the triggered order of that order ID', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.openingOrders).not.toContainEqual(triggeredOrder);
      });
      it('[THEN] it will return canceled orders list with the triggered order be canceled', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.canceledOrders).toContainEqual({
          ...triggeredOrder,
          status: 'CANCELED',
          canceledAt: currentDate,
        });
      });
      it('[THEN] it will return submitted orders list with the cancel order be summited', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.submittedOrders).toContainEqual({
          ...cancelOrder,
          status: 'SUBMITTED',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening and rejected orders lists', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.openingOrders).not.toContainEqual(orders.openingOrders);
        expect(result.orders.rejectedOrders).not.toContainEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersCapital: 150,
          availableCapital: 550,
        });
      });
    });
  });

  describe('[GIVEN] there is a triggered exit order with order ID that matches the cancel order', () => {
    const currentDate = new Date('2022-06-12') as ValidDate;
    const deps = { dateService: { getCurrentDate: () => currentDate } };

    const strategyModule = mockStrategyModule({ inOrdersAssetQuantity: 12, availableAssetQuantity: 20 });

    const triggeredOrder = mockTriggeredOrder({ orderSide: 'EXIT', quantity: 5 });
    const cancelOrder = mockPendingCancelOrder({ orderIdToCancel: triggeredOrder.id });
    const orders = {
      openingOrders: [],
      triggeredOrders: [triggeredOrder],
      submittedOrders: [],
      canceledOrders: [],
      rejectedOrders: [],
    };

    describe('[WHEN] process pending CANCEL order', () => {
      it('[THEN] it will return triggered orders list without the triggered order of that order ID', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.openingOrders).not.toContainEqual(triggeredOrder);
      });
      it('[THEN] it will return canceled orders list with the triggered order be canceled', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.canceledOrders).toContainEqual({
          ...triggeredOrder,
          status: 'CANCELED',
          canceledAt: currentDate,
        });
      });
      it('[THEN] it will return submitted orders list with the cancel order be summited', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.submittedOrders).toContainEqual({
          ...cancelOrder,
          status: 'SUBMITTED',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged opening and rejected orders lists', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.openingOrders).not.toContainEqual(orders.openingOrders);
        expect(result.orders.rejectedOrders).not.toContainEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersAssetQuantity: 7,
          availableAssetQuantity: 25,
        });
      });
    });
  });

  describe('[GIVEN] there is no opening order with order ID that matches the cancel order', () => {
    const currentDate = new Date('2022-06-12') as ValidDate;
    const deps = { dateService: { getCurrentDate: () => currentDate } };

    const strategyModule = mockStrategyModule();

    const cancelOrder = mockPendingCancelOrder();
    const orders = {
      openingOrders: [],
      triggeredOrders: [],
      submittedOrders: [],
      canceledOrders: [],
      rejectedOrders: [],
    };

    describe('[WHEN] process pending CANCEL order', () => {
      it('[THEN] it will return unchanged opening, triggered, submitted, and canceled orders list', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
        expect(result.orders.triggeredOrders).toEqual(orders.triggeredOrders);
        expect(result.orders.submittedOrders).toEqual(orders.submittedOrders);
        expect(result.orders.canceledOrders).toEqual(orders.canceledOrders);
      });
      it('[THEN] it will return rejected orders list with the cancel order be rejected', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...cancelOrder,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged strategy', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.strategyModule).toEqual(strategyModule);
      });
    });
  });
});

describe('UUT: Process pending orders', () => {
  function mockDeps(overrides?: DeepPartial<ProcessOrdersDeps>): ProcessOrdersDeps {
    return mergeDeepRight(
      {
        dateService: { getCurrentDate: () => new Date('2020-02-02') as ValidDate },
        generateTradeId: () => 'uWdrrs_VYY' as TradeId,
      },
      overrides ?? {},
    );
  }

  const defaultOrders = {
    pendingOrders: [],
    submittedOrders: [],
    openingOrders: [],
    triggeredOrders: [],
    filledOrders: [],
    canceledOrders: [],
    rejectedOrders: [],
  };
  const defaultTrades = { openingTrades: [], closedTrades: [] };
  const defaultCurrentPrice = 10 as Price;

  describe('[GIVEN] pending orders list is empty', () => {
    const deps = mockDeps();
    const strategyModule = mockStrategyModule();
    const orders = { ...defaultOrders, pendingOrders: [] };
    const trades = defaultTrades;
    const currentPrice = defaultCurrentPrice;

    describe('[WHEN] process pending orders', () => {
      it('[THEN] it will return orders without pending orders list', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders).toEqual(dissoc('pendingOrders', orders));
      });
      it('[THEN] it will return unchanged strategy and trades lists', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.strategyModule).toEqual(strategyModule);
        expect(result.trades).toEqual(trades);
      });
    });
  });

  describe('[GIVEN] pending orders list includes a valid entry MARKET order', () => {
    const currentDate = new Date('2020-01-02') as ValidDate;
    const tradeId = 'YRQU7OsXZm' as TradeId;
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      generateTradeId: () => tradeId,
    });
    const strategyModule = mockStrategyModule({
      totalCapital: 1000,
      availableCapital: 100,
      totalAssetQuantity: 60,
      availableAssetQuantity: 30,
      takerFeeRate: 1,
    });
    const marketOrder = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });
    const orders = { ...defaultOrders, pendingOrders: [marketOrder] };
    const trades = defaultTrades;
    const currentPrice = 5 as Price;

    describe('[WHEN] process pending orders', () => {
      it('[THEN] it will return filled orders list with the MARKET order be filled', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.filledOrders).toContainEqual({
          ...marketOrder,
          status: 'FILLED',
          filledPrice: currentPrice,
          fee: { amount: 0.1, currency: strategyModule.assetCurrency },
          submittedAt: currentDate,
          filledAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged submitted, opening, canceled, and rejected orders list', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.submittedOrders).toEqual(orders.submittedOrders);
        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
        expect(result.orders.canceledOrders).toEqual(orders.canceledOrders);
        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return opening trades list with a new opening trade', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.trades.openingTrades).toContainEqual({
          id: tradeId,
          entryOrder: {
            ...marketOrder,
            status: 'FILLED',
            filledPrice: currentPrice,
            fee: { amount: 0.1, currency: strategyModule.assetCurrency },
            submittedAt: currentDate,
            filledAt: currentDate,
          },
          tradeQuantity: 9.9,
          maxDrawdown: 0,
          minPrice: currentPrice,
          maxRunup: 0,
          maxPrice: currentPrice,
          unrealizedReturn: 0,
        });
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          totalCapital: 950,
          availableCapital: 50,
          totalAssetQuantity: 69.9,
          availableAssetQuantity: 39.9,
          totalFees: { ...strategyModule.totalFees, inAssetCurrency: 0.1 },
        });
      });
    });
  });

  describe('[GIVEN] pending orders list includes 2 valid entry order [BUT] strategy has available capital only for one order', () => {
    const currentDate = new Date('2020-01-02') as ValidDate;
    const tradeId = 'YRQU7OsXZm' as TradeId;
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      generateTradeId: () => tradeId,
    });
    const strategyModule = mockStrategyModule({
      totalCapital: 1000,
      availableCapital: 60,
      totalAssetQuantity: 60,
      availableAssetQuantity: 30,
      takerFeeRate: 1,
    });
    const marketOrder1 = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });
    const marketOrder2 = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });
    const orders = { ...defaultOrders, pendingOrders: [marketOrder1, marketOrder2] };
    const trades = defaultTrades;
    const currentPrice = 5 as Price;

    describe('[WHEN] process pending orders', () => {
      it('[THEN] it will return filled orders list with the first MARKET order be filled', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.filledOrders).toContainEqual({
          ...marketOrder1,
          status: 'FILLED',
          filledPrice: currentPrice,
          fee: { amount: 0.1, currency: strategyModule.assetCurrency },
          submittedAt: currentDate,
          filledAt: currentDate,
        });
      });
      it('[THEN] it will return rejected orders list with the second MARKET order be rejected', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...marketOrder2,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged submitted, opening, and canceled orders list', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.submittedOrders).toEqual(orders.submittedOrders);
        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
        expect(result.orders.canceledOrders).toEqual(orders.canceledOrders);
      });
      it('[THEN] it will return opening trades list with a new opening trade', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.trades.openingTrades).toContainEqual({
          id: tradeId,
          entryOrder: {
            ...marketOrder1,
            status: 'FILLED',
            filledPrice: currentPrice,
            fee: { amount: 0.1, currency: strategyModule.assetCurrency },
            submittedAt: currentDate,
            filledAt: currentDate,
          },
          tradeQuantity: 9.9,
          maxDrawdown: 0,
          minPrice: currentPrice,
          maxRunup: 0,
          maxPrice: currentPrice,
          unrealizedReturn: 0,
        });
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          totalCapital: 950,
          availableCapital: 10,
          totalAssetQuantity: 69.9,
          availableAssetQuantity: 39.9,
          totalFees: { ...strategyModule.totalFees, inAssetCurrency: 0.1 },
        });
      });
    });
  });

  describe('[GIVEN] pending orders list includes a valid exit STOP_LIMIT order', () => {
    const currentDate = new Date('2020-01-02') as ValidDate;
    const deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    const strategyModule = mockStrategyModule({ inOrdersAssetQuantity: 10, availableAssetQuantity: 30 });
    const stopLimitOrder = mockPendingStopLimitOrder({ orderSide: 'EXIT', quantity: 10 });
    const orders = { ...defaultOrders, pendingOrders: [stopLimitOrder] };
    const trades = defaultTrades;
    const currentPrice = defaultCurrentPrice;

    describe('[WHEN] process pending orders', () => {
      it('[THEN] it will return opening orders list with the STOP_LIMIT order be opened', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.openingOrders).toContainEqual({
          ...stopLimitOrder,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged submitted, filled, canceled, and rejected orders list', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.submittedOrders).toEqual(orders.submittedOrders);
        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
        expect(result.orders.canceledOrders).toEqual(orders.canceledOrders);
        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.trades.openingTrades).toEqual(trades.openingTrades);
        expect(result.trades.closedTrades).toEqual(trades.closedTrades);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersAssetQuantity: 20,
          availableAssetQuantity: 20,
        });
      });
    });
  });

  describe('[GIVEN] pending orders list includes a cancel order [AND] opening orders list includes an exit order with order ID that matches the cancel order', () => {
    const currentDate = new Date('2020-01-02') as ValidDate;
    const deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    const strategyModule = mockStrategyModule({ inOrdersAssetQuantity: 10, availableAssetQuantity: 30 });
    const openingOrder = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 10 });
    const cancelOrder = mockPendingCancelOrder({ orderIdToCancel: openingOrder.id });
    const orders = { ...defaultOrders, pendingOrders: [cancelOrder], openingOrders: [openingOrder] };
    const trades = defaultTrades;
    const currentPrice = defaultCurrentPrice;

    describe('[WHEN] process pending orders', () => {
      it('[THEN] it will return opening orders list without the opening order with order ID that matches the cancel order', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.openingOrders).not.toContainEqual(openingOrder);
      });
      it('[THEN] it will return canceled orders list with the opening order with order ID that matches the cancel order be canceled', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.canceledOrders).toContainEqual({
          ...openingOrder,
          status: 'CANCELED',
          canceledAt: currentDate,
        });
      });
      it('[THEN] it will return submitted orders list with the cancel order be submitted', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.submittedOrders).toContainEqual({
          ...cancelOrder,
          status: 'SUBMITTED',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return unchanged filled and rejected orders list', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.orders.filledOrders).toEqual(orders.filledOrders);
        expect(result.orders.rejectedOrders).toEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return unchanged opening and closed trades list', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.trades.openingTrades).toEqual(trades.openingTrades);
        expect(result.trades.closedTrades).toEqual(trades.closedTrades);
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
          inOrdersAssetQuantity: 0,
          availableAssetQuantity: 40,
        });
      });
    });
  });
});
