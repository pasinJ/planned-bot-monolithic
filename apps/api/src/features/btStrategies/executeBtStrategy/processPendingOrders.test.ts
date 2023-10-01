import { dissoc, mergeDeepRight, omit } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { StrategyModule } from '#features/shared/executorModules/strategy.js';
import { TradeId } from '#features/shared/executorModules/trades.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeIo } from '#shared/utils/fp.js';
import { randomDate } from '#test-utils/faker/date.js';
import {
  mockOpeningLimitOrder,
  mockPendingCancelOrder,
  mockPendingLimitOrder,
  mockPendingMarketOrder,
  mockPendingStopLimitOrder,
  mockPendingStopMarketOrder,
} from '#test-utils/features/shared/order.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategy.js';
import { mockOpeningTrade, randomTradeId } from '#test-utils/features/shared/trades.js';
import {
  mockLotSizeFilter,
  mockMinNotionalFilter,
  mockNotionalFilter,
  mockPriceFilter,
  mockSymbol,
} from '#test-utils/features/symbols/models.js';

import { Price } from '../dataModels/kline.js';
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
      { dateService: { getCurrentDate: () => randomDate() }, generateTradeId: () => randomTradeId() },
      overrides ?? {},
    );
  }
  function validSetup() {
    const currentDate = randomDate();
    const tradeId = randomTradeId();
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      generateTradeId: () => tradeId,
    });
    const symbol = mockSymbol({ orderTypes: ['MARKET'], filters: [] });
    const strategy = mockStrategyModule({
      initialCapital: 1000,
      totalCapital: 1000,
      availableCapital: 1000,
      totalAssetQuantity: 100,
      availableAssetQuantity: 100,
      makerFeeRate: 1,
      takerFeeRate: 2,
      totalFees: { inBaseCurrency: 0, inAssetCurrency: 0 },
      baseCurrency: symbol.quoteAsset,
      assetCurrency: symbol.baseAsset,
      symbol,
    });
    const orders = { filledOrders: [], rejectedOrders: [] };
    const openingTrade = mockOpeningTrade({ tradeQuantity: 10 });
    const trades = { openingTrades: [openingTrade], closedTrades: [] };
    const currentPrice = 10 as Price;

    return { strategy, orders, trades, openingTrade, deps, tradeId, currentDate, currentPrice };
  }

  describe('[GIVEN] the order is a valid entry MARKET order', () => {
    function setup() {
      const { strategy, orders, trades, deps, tradeId, currentDate, currentPrice } = validSetup();
      const order = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });

      return { strategy, order, orders, trades, deps, tradeId, currentDate, currentPrice };
    }

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return filled orders list with the order be filled', () => {
        const { strategy, order, orders, trades, deps, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.filledOrders).toContainEqual({
          ...order,
          status: 'FILLED',
          filledPrice: currentPrice,
          fee: { amount: 0.2, currency: strategy.assetCurrency },
          submittedAt: currentDate,
          filledAt: currentDate,
        });
      });
      it('[THEN] it will return opening trades list with a new opening trade', () => {
        const { strategy, order, orders, trades, deps, tradeId, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.trades.openingTrades).toContainEqual({
          id: tradeId,
          entryOrder: {
            ...order,
            status: 'FILLED',
            filledPrice: currentPrice,
            fee: { amount: 0.2, currency: strategy.assetCurrency },
            submittedAt: currentDate,
            filledAt: currentDate,
          },
          tradeQuantity: 9.8,
          maxDrawdown: 0,
          maxRunup: 0,
        });
      });
      it('[THEN] it will return strategy with updated available capital', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.availableCapital).toBe(900);
      });
      it('[THEN] it will return strategy with updated total asset quantity', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.totalAssetQuantity).toBe(109.8);
      });
      it('[THEN] it will return strategy with updated available asset quantity', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.availableAssetQuantity).toBe(109.8);
      });
      it('[THEN] it will return strategy with accumulate total fee', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.totalFees).toEqual({ inBaseCurrency: 0, inAssetCurrency: 0.2 });
      });
    });
  });

  describe('[GIVEN] the order is an entry MARKET order [BUT] strategy does not has enough available capital', () => {
    function setup() {
      const { strategy, orders, trades, deps, tradeId, currentDate, currentPrice } = validSetup();
      const order = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });

      return {
        strategy: { ...strategy, availableCapital: 50 } as StrategyModule,
        order,
        orders,
        trades,
        deps,
        tradeId,
        currentDate,
        currentPrice,
      };
    }

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { strategy, order, orders, trades, deps, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });

  describe('[GIVEN] the order is a valid exit MARKET order', () => {
    function setup() {
      const { strategy, orders, trades, openingTrade, deps, tradeId, currentDate, currentPrice } =
        validSetup();
      const order = mockPendingMarketOrder({ orderSide: 'EXIT', quantity: 10 });

      return { strategy, order, orders, openingTrade, trades, deps, tradeId, currentDate, currentPrice };
    }

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return filled orders list with the filled MARKET order', () => {
        const { strategy, order, orders, trades, deps, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.filledOrders).toContainEqual({
          ...order,
          status: 'FILLED',
          filledPrice: currentPrice,
          fee: { amount: 2, currency: strategy.baseCurrency },
          submittedAt: currentDate,
          filledAt: currentDate,
        });
      });
      it('[THEN] it will return opening trades list without the matching opening trade', () => {
        const { strategy, order, orders, trades, deps, openingTrade, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.trades.openingTrades).not.toContainEqual(openingTrade);
      });
      it('[THEN] it will return closed trades list with the matching opening trade', () => {
        const { strategy, order, orders, trades, deps, openingTrade, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.trades.closedTrades).toContainEqual({
          ...openingTrade,
          exitOrder: {
            ...order,
            status: 'FILLED',
            filledPrice: currentPrice,
            fee: { amount: 2, currency: strategy.baseCurrency },
            submittedAt: currentDate,
            filledAt: currentDate,
          },
        });
      });
      it('[THEN] it will return strategy with updated total capital', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.totalCapital).toBe(1098);
      });
      it('[THEN] it will return strategy with updated available capital', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.availableCapital).toBe(1098);
      });
      it('[THEN] it will return strategy with updated total asset quantity', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.totalAssetQuantity).toBe(90);
      });
      it('[THEN] it will return strategy with updated available asset quantity', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.availableAssetQuantity).toBe(90);
      });
      it('[THEN] it will return strategy with accumulate total fee', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.totalFees).toEqual({ inBaseCurrency: 2, inAssetCurrency: 0 });
      });
    });
  });

  describe('[GIVEN] the order is an exit MARKET order [BUT] strategy does not has enough available asset quantity', () => {
    function setup() {
      const { strategy, orders, trades, openingTrade, deps, tradeId, currentDate, currentPrice } =
        validSetup();
      const order = mockPendingMarketOrder({ orderSide: 'EXIT', quantity: 10 });

      return {
        strategy: { ...strategy, availableAssetQuantity: 5 } as StrategyModule,
        order,
        orders,
        openingTrade,
        trades,
        deps,
        tradeId,
        currentDate,
        currentPrice,
      };
    }

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { strategy, order, orders, trades, deps, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });

  describe('[GIVEN] the order is a MARKET order [BUT] the MARKET order type is not allowed', () => {
    function setup() {
      const {
        strategy: strategyModule,
        orders,
        trades,
        deps,
        tradeId,
        currentDate,
        currentPrice,
      } = validSetup();
      const order = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });

      return {
        strategy: {
          ...strategyModule,
          symbol: { ...strategyModule.symbol, orderTypes: ['LIMIT'] },
        } as StrategyModule,
        order,
        orders,
        trades,
        deps,
        tradeId,
        currentDate,
        currentPrice,
      };
    }

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { strategy, order, orders, trades, deps, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });

  describe('[GIVEN] the order is a MARKET order [BUT] the quantity property is invalid', () => {
    function setup() {
      const { strategy, orders, trades, deps, tradeId, currentDate, currentPrice } = validSetup();
      const order = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 0 });

      return { strategy, order, orders, trades, deps, tradeId, currentDate, currentPrice };
    }

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { strategy, order, orders, trades, deps, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });

  describe('[GIVEN] the order is a MARKET order [BUT] the notional is invalid', () => {
    function setup() {
      const {
        strategy: strategyModule,
        orders,
        trades,
        deps,
        tradeId,
        currentDate,
        currentPrice,
      } = validSetup();
      const order = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });

      return {
        strategy: {
          ...strategyModule,
          symbol: {
            ...strategyModule.symbol,
            filters: [mockMinNotionalFilter({ applyToMarket: true, avgPriceMins: 0, minNotional: 150 })],
          },
        } as StrategyModule,
        order,
        orders,
        trades,
        deps,
        tradeId,
        currentDate,
        currentPrice,
      };
    }

    describe('[WHEN] process pending a pending MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { strategy, order, orders, trades, deps, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingMarketOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });
});

describe('UUT: Process pending LIMIT order', () => {
  function mockDeps(overrides?: DeepPartial<ProcessPendingLimitOrderDeps>): ProcessPendingLimitOrderDeps {
    return mergeDeepRight(
      { dateService: { getCurrentDate: () => randomDate() }, generateTradeId: () => randomTradeId() },
      overrides ?? {},
    );
  }
  function validSetup() {
    const currentDate = randomDate();
    const tradeId = randomTradeId();
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      generateTradeId: () => tradeId,
    });
    const symbol = mockSymbol({ orderTypes: ['LIMIT'], filters: [] });
    const strategy = mockStrategyModule({
      initialCapital: 1000,
      totalCapital: 300,
      inOrdersCapital: 200,
      availableCapital: 500,
      totalAssetQuantity: 100,
      inOrdersAssetQuantity: 10,
      availableAssetQuantity: 50,
      makerFeeRate: 1,
      takerFeeRate: 2,
      totalFees: { inBaseCurrency: 0, inAssetCurrency: 0 },
      baseCurrency: symbol.quoteAsset,
      assetCurrency: symbol.baseAsset,
      symbol,
    });
    const orders = { openingOrders: [], filledOrders: [], rejectedOrders: [] };
    const openingTrade = mockOpeningTrade({ tradeQuantity: 10 });
    const trades = { openingTrades: [openingTrade], closedTrades: [] };

    return { strategy, orders, tradeId, trades, openingTrade, deps, currentDate };
  }

  describe('[GIVEN] the order is a valid entry LIMIT order [AND] the limit price is less than the current price', () => {
    function setup() {
      const { deps, orders, trades, strategy, currentDate } = validSetup();
      const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
      const currentPrice = 7 as Price;

      return { deps, order, orders, strategy, trades, currentDate, currentPrice };
    }

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return opening orders list with the order be opened', () => {
        const { deps, order, orders, strategy, currentDate, trades, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.openingOrders).toContainEqual({
          ...order,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return a strategy with updated available capital', () => {
        const { deps, order, orders, strategy, currentPrice, trades } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule).toHaveProperty('availableCapital', 450);
      });
      it('[THEN] it will return a strategy with updated in-orders capital', () => {
        const { deps, order, orders, strategy, currentPrice, trades } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule).toHaveProperty('inOrdersCapital', 250);
      });
    });
  });

  describe('[GIVEN] the order is a valid entry LIMIT order [AND] the limit price is greater than or equal to the current price', () => {
    function setup() {
      const { deps, orders, tradeId, trades, strategy, currentDate } = validSetup();
      const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
      const currentPrice = 4 as Price;

      return { deps, order, orders, tradeId, trades, strategy, currentDate, currentPrice };
    }

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return filled orders list with the order be filled', () => {
        const { strategy, order, orders, trades, deps, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.filledOrders).toContainEqual({
          ...order,
          status: 'FILLED',
          filledPrice: currentPrice,
          fee: { amount: 0.2, currency: strategy.assetCurrency },
          submittedAt: currentDate,
          filledAt: currentDate,
        });
      });
      it('[THEN] it will return opening trades list with a new opening trade', () => {
        const { strategy, order, orders, trades, deps, tradeId, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.trades.openingTrades).toContainEqual({
          id: tradeId,
          entryOrder: {
            ...order,
            status: 'FILLED',
            filledPrice: currentPrice,
            fee: { amount: 0.2, currency: strategy.assetCurrency },
            submittedAt: currentDate,
            filledAt: currentDate,
          },
          tradeQuantity: 9.8,
          maxDrawdown: 0,
          maxRunup: 0,
        });
      });
      it('[THEN] it will return strategy with updated available capital', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.availableCapital).toBe(460);
      });
      it('[THEN] it will return strategy with updated total asset quantity', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.totalAssetQuantity).toBe(109.8);
      });
      it('[THEN] it will return strategy with updated available asset quantity', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.availableAssetQuantity).toBe(59.8);
      });
      it('[THEN] it will return strategy with accumulate total fee', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.totalFees).toEqual({ inBaseCurrency: 0, inAssetCurrency: 0.2 });
      });
    });
  });

  describe('[GIVEN] the order is an entry LIMIT order [BUT] strategy does not has enough available capital', () => {
    function setup() {
      const { deps, orders, strategy, trades, currentDate } = validSetup();
      const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
      const currentPrice = 7 as Price;

      return {
        deps,
        order,
        orders,
        trades,
        currentPrice,
        strategy: { ...strategy, availableCapital: 30 } as StrategyModule,
        currentDate,
      };
    }

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { deps, order, orders, strategy, trades, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });

  describe('[GIVEN] the order is a valid exit LIMIT order [AND] the limit price is greater than the current price', () => {
    function setup() {
      const { deps, orders, strategy, trades, currentDate } = validSetup();
      const order = mockPendingLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 5 });
      const currentPrice = 4 as Price;

      return { deps, order, orders, strategy, trades, currentDate, currentPrice };
    }

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return opening orders list with the order be opened', () => {
        const { deps, order, orders, strategy, trades, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.openingOrders).toContainEqual({
          ...order,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return a strategy with updated available asset quantity', () => {
        const { deps, order, orders, strategy, trades, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule).toHaveProperty('availableAssetQuantity', 40);
      });
      it('[THEN] it will return a strategy with updated in-orders asset quantity', () => {
        const { deps, order, orders, strategy, trades, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule).toHaveProperty('inOrdersAssetQuantity', 20);
      });
    });
  });

  describe('[GIVEN] the order is a valid exit LIMIT order [AND] the limit price is less than or equal to the current price', () => {
    function setup() {
      const { deps, orders, tradeId, trades, strategy, openingTrade, currentDate } = validSetup();
      const order = mockPendingLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 5 });
      const currentPrice = 10 as Price;

      return { deps, order, orders, tradeId, trades, strategy, currentDate, openingTrade, currentPrice };
    }

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return filled orders list with the filled MARKET order', () => {
        const { strategy, order, orders, trades, deps, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.filledOrders).toContainEqual({
          ...order,
          status: 'FILLED',
          filledPrice: currentPrice,
          fee: { amount: 2, currency: strategy.baseCurrency },
          submittedAt: currentDate,
          filledAt: currentDate,
        });
      });
      it('[THEN] it will return opening trades list without the matching opening trade', () => {
        const { strategy, order, orders, trades, deps, openingTrade, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.trades.openingTrades).not.toContainEqual(openingTrade);
      });
      it('[THEN] it will return closed trades list with the matching opening trade', () => {
        const { strategy, order, orders, trades, deps, openingTrade, currentDate, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.trades.closedTrades).toContainEqual({
          ...openingTrade,
          exitOrder: {
            ...order,
            status: 'FILLED',
            filledPrice: currentPrice,
            fee: { amount: 2, currency: strategy.baseCurrency },
            submittedAt: currentDate,
            filledAt: currentDate,
          },
        });
      });
      it('[THEN] it will return strategy with updated total capital', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.totalCapital).toBe(398);
      });
      it('[THEN] it will return strategy with updated available capital', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.availableCapital).toBe(598);
      });
      it('[THEN] it will return strategy with updated total asset quantity', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.totalAssetQuantity).toBe(90);
      });
      it('[THEN] it will return strategy with updated available asset quantity', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.availableAssetQuantity).toBe(40);
      });
      it('[THEN] it will return strategy with accumulate total fee', () => {
        const { strategy, order, orders, trades, deps, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.strategyModule.totalFees).toEqual({ inBaseCurrency: 2, inAssetCurrency: 0 });
      });
    });
  });

  describe('[GIVEN] the order is an entry LIMIT order [BUT] strategy does not has enough available asset quantity', () => {
    function setup() {
      const { deps, orders, strategy, currentDate, trades } = validSetup();
      const order = mockPendingLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 5 });
      const currentPrice = 4 as Price;

      return {
        deps,
        order,
        orders,
        strategy: { ...strategy, availableAssetQuantity: 8 } as StrategyModule,
        currentDate,
        currentPrice,
        trades,
      };
    }

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { deps, order, orders, strategy, currentDate, trades, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });

  describe('[GIVEN] the order is a LIMIT order [BUT] the LIMIT order type is not allowed', () => {
    function setup() {
      const { deps, orders, strategy, currentDate, trades } = validSetup();
      const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
      const currentPrice = 6 as Price;

      return {
        deps,
        order,
        orders,
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, orderTypes: ['MARKET'] },
        } as StrategyModule,
        currentDate,
        trades,
        currentPrice,
      };
    }

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { deps, order, orders, strategy, currentDate, trades, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });
  describe('[GIVEN] the order is a LIMIT order [BUT] the quantity property is invalid', () => {
    function setup() {
      const { deps, orders, strategy, currentDate, trades } = validSetup();
      const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
      const currentPrice = 6 as Price;

      return {
        deps,
        order,
        orders,
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, filters: [mockLotSizeFilter({ maxQty: 9 })] },
        } as StrategyModule,
        currentDate,
        trades,
        currentPrice,
      };
    }

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { deps, order, orders, strategy, currentDate, trades, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });
  describe('[GIVEN] the order is a LIMIT order [BUT] the limit price property is invalid', () => {
    function setup() {
      const { deps, orders, strategy, currentDate, trades } = validSetup();
      const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
      const currentPrice = 6 as Price;

      return {
        deps,
        order,
        orders,
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, filters: [mockPriceFilter({ minPrice: 10 })] },
        } as StrategyModule,
        currentDate,
        trades,
        currentPrice,
      };
    }

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { deps, order, orders, strategy, currentDate, trades, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });
  describe('[GIVEN] the order is a LIMIT order [BUT] the notional is invalid', () => {
    function setup() {
      const { deps, orders, strategy, currentDate, trades } = validSetup();
      const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
      const currentPrice = 6 as Price;

      return {
        deps,
        order,
        orders,
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, filters: [mockMinNotionalFilter({ minNotional: 60 })] },
        } as StrategyModule,
        currentDate,
        trades,
        currentPrice,
      };
    }

    describe('[WHEN] process a pending LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order be rejected', () => {
        const { deps, order, orders, strategy, currentDate, trades, currentPrice } = setup();

        const result = executeIo(
          processPendingLimitOrder(deps, strategy, orders, trades, order, currentPrice),
        );

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          submittedAt: currentDate,
          reason: expect.toBeString(),
        });
      });
    });
  });
});

describe('UUT: Process pending STOP_MARKET order', () => {
  function mockDeps(
    overrides?: DeepPartial<ProcessPendingStopMarketOrderDeps>,
  ): ProcessPendingStopMarketOrderDeps {
    return mergeDeepRight({ dateService: { getCurrentDate: () => randomDate() } }, overrides ?? {});
  }
  function validSetup() {
    const currentDate = randomDate();
    const deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    const symbol = mockSymbol({ orderTypes: ['STOP_LOSS', 'TAKE_PROFIT'], filters: [] });
    const strategy = mockStrategyModule({
      initialCapital: 1000,
      totalCapital: 300,
      inOrdersCapital: 200,
      availableCapital: 500,
      totalAssetQuantity: 100,
      inOrdersAssetQuantity: 10,
      availableAssetQuantity: 50,
      makerFeeRate: 1,
      takerFeeRate: 2,
      totalFees: { inBaseCurrency: 0, inAssetCurrency: 0 },
      baseCurrency: symbol.quoteAsset,
      assetCurrency: symbol.baseAsset,
      symbol,
    });
    const orders = { openingOrders: [], rejectedOrders: [] };

    return { strategy, orders, deps, currentDate };
  }

  describe('[GIVEN] the order is a valid entry STOP_MARKET order', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

      return { strategy, orders, deps, currentDate, order };
    }

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return opening orders list with the order in opening state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.orders.openingOrders).toContainEqual({
          ...order,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return strategy with updated in-orders capital', () => {
        const { strategy, orders, deps, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.strategyModule).toHaveProperty('inOrdersCapital', 320);
      });
      it('[THEN] it will return strategy with updated available capital', () => {
        const { strategy, orders, deps, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.strategyModule).toHaveProperty('availableCapital', 380);
      });
    });
  });
  describe('[GIVEN] the order is a entry STOP_MARKET order [BUT] strategy does not has enough available capital', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

      return {
        strategy: { ...strategy, availableCapital: 100 } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });

  describe('[GIVEN] the order is a valid exit STOP_MARKET order', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopMarketOrder({ orderSide: 'EXIT', quantity: 10, stopPrice: 12 });

      return { strategy, orders, deps, currentDate, order };
    }

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return opening orders list with the order in opening state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.orders.openingOrders).toContainEqual({
          ...order,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return strategy with updated in-orders asset quantity', () => {
        const { strategy, orders, deps, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.strategyModule).toHaveProperty('inOrdersAssetQuantity', 20);
      });
      it('[THEN] it will return strategy with updated available asset quantity', () => {
        const { strategy, orders, deps, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.strategyModule).toHaveProperty('availableAssetQuantity', 40);
      });
    });
  });
  describe('[GIVEN] the order is a valid exit STOP_MARKET order [BUT] strategy does not has enough available asset quantity', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopMarketOrder({ orderSide: 'EXIT', quantity: 10, stopPrice: 12 });

      return {
        strategy: { ...strategy, availableAssetQuantity: 9 } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });

  describe('[GIVEN] the order is a STOP_MARKET order [BUT] the STOP_MARKET order type is not allowed', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

      return {
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, orderTypes: ['MARKET'] },
        } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });
  describe('[GIVEN] the order is a STOP_MARKET order [BUT] the quantity property is invalid', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

      return {
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, filters: [mockLotSizeFilter({ minQty: 12, maxQty: 15 })] },
        } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });
  describe('[GIVEN] the order is a STOP_MARKET order [BUT] the stop price property is invalid', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

      return {
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, filters: [mockPriceFilter({ minPrice: 1, maxPrice: 10 })] },
        } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });
  describe('[GIVEN] the order is a STOP_MARKET order [BUT] the notional is invalid', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 12 });

      return {
        strategy: {
          ...strategy,
          symbol: {
            ...strategy.symbol,
            filters: [mockNotionalFilter({ minNotional: 1, maxNotional: 100 })],
          },
        } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_MARKET order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopMarketOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });
});

describe('UUT: Process pending STOP_LIMIT order', () => {
  function mockDeps(
    overrides?: DeepPartial<ProcessPendingStopLimitOrderDeps>,
  ): ProcessPendingStopLimitOrderDeps {
    return mergeDeepRight({ dateService: { getCurrentDate: () => randomDate() } }, overrides ?? {});
  }
  function validSetup() {
    const currentDate = randomDate();
    const deps = mockDeps({ dateService: { getCurrentDate: () => currentDate } });
    const symbol = mockSymbol({ orderTypes: ['STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'], filters: [] });
    const strategy = mockStrategyModule({
      initialCapital: 1000,
      totalCapital: 300,
      inOrdersCapital: 200,
      availableCapital: 500,
      totalAssetQuantity: 100,
      inOrdersAssetQuantity: 10,
      availableAssetQuantity: 50,
      makerFeeRate: 1,
      takerFeeRate: 2,
      totalFees: { inBaseCurrency: 0, inAssetCurrency: 0 },
      baseCurrency: symbol.quoteAsset,
      assetCurrency: symbol.baseAsset,
      symbol,
    });
    const orders = { openingOrders: [], rejectedOrders: [] };

    return { strategy, orders, deps, currentDate };
  }

  describe('[GIVEN] the order is a valid entry STOP_LIMIT order', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopLimitOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        stopPrice: 12,
        limitPrice: 15,
      });

      return { strategy, orders, deps, currentDate, order };
    }

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return opening orders list with the order in opening state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.orders.openingOrders).toContainEqual({
          ...order,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return strategy with updated in-orders capital', () => {
        const { strategy, orders, deps, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.strategyModule).toHaveProperty('inOrdersCapital', 350);
      });
      it('[THEN] it will return strategy with updated available capital', () => {
        const { strategy, orders, deps, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.strategyModule).toHaveProperty('availableCapital', 350);
      });
    });
  });
  describe('[GIVEN] the order is a entry STOP_LIMIT order [BUT] strategy does not has enough available capital', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopLimitOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        stopPrice: 12,
        limitPrice: 15,
      });

      return {
        strategy: { ...strategy, availableCapital: 100 } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });

  describe('[GIVEN] the order is a valid exit STOP_LIMIT order', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopLimitOrder({
        orderSide: 'EXIT',
        quantity: 10,
        stopPrice: 12,
        limitPrice: 15,
      });

      return { strategy, orders, deps, currentDate, order };
    }

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return opening orders list with the order in opening state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.orders.openingOrders).toContainEqual({
          ...order,
          status: 'OPENING',
          submittedAt: currentDate,
        });
      });
      it('[THEN] it will return strategy with updated in-orders asset quantity', () => {
        const { strategy, orders, deps, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.strategyModule).toHaveProperty('inOrdersAssetQuantity', 20);
      });
      it('[THEN] it will return strategy with updated available asset quantity', () => {
        const { strategy, orders, deps, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.strategyModule).toHaveProperty('availableAssetQuantity', 40);
      });
    });
  });
  describe('[GIVEN] the order is a exit STOP_LIMIT order [BUT] strategy does not has enough available capital', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopLimitOrder({
        orderSide: 'EXIT',
        quantity: 10,
        stopPrice: 12,
        limitPrice: 15,
      });

      return {
        strategy: { ...strategy, availableAssetQuantity: 8 } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });

  describe('[GIVEN] the order is an entry STOP_LIMIT order [BUT] the STOP_MARKET order type is not allowed', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopLimitOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        stopPrice: 12,
        limitPrice: 15,
      });

      return {
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, orderTypes: ['MARKET'] },
        } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });
  describe('[GIVEN] the order is an entry STOP_LIMIT order [BUT] the quantity property is invalid', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopLimitOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        stopPrice: 12,
        limitPrice: 15,
      });

      return {
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, filters: [mockLotSizeFilter({ minQty: 15 })] },
        } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });
  describe('[GIVEN] the order is an entry STOP_LIMIT order [BUT] the stop price property is invalid', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopLimitOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        stopPrice: 12,
        limitPrice: 15,
      });

      return {
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, filters: [mockPriceFilter({ minPrice: 13, maxPrice: 20 })] },
        } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });
  describe('[GIVEN] the order is an entry STOP_LIMIT order [BUT] the limit price property is invalid', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopLimitOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        stopPrice: 12,
        limitPrice: 15,
      });

      return {
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, filters: [mockPriceFilter({ minPrice: 10, maxPrice: 13 })] },
        } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
      });
    });
  });
  describe('[GIVEN] the order is an entry STOP_LIMIT order [BUT] the notional is invalid', () => {
    function setup() {
      const { strategy, orders, deps, currentDate } = validSetup();
      const order = mockPendingStopLimitOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        stopPrice: 12,
        limitPrice: 15,
      });

      return {
        strategy: {
          ...strategy,
          symbol: { ...strategy.symbol, filters: [mockMinNotionalFilter({ minNotional: 200 })] },
        } as StrategyModule,
        orders,
        deps,
        currentDate,
        order,
      };
    }

    describe('[WHEN] process a pending STOP_LIMIT order', () => {
      it('[THEN] it will return rejected orders list with the order in rejected state', () => {
        const { strategy, orders, deps, currentDate, order } = setup();

        const result = executeIo(processPendingStopLimitOrder(deps, strategy, orders, order));

        expect(result.orders.rejectedOrders).toContainEqual({
          ...order,
          status: 'REJECTED',
          reason: expect.toBeString(),
          submittedAt: currentDate,
        });
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
      it('[THEN] it will return unchanged rejected orders list', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.rejectedOrders).not.toContainEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return strategy with in-orders capital property equals to the current value - (opening order quantity * limit price)', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.strategyModule).toHaveProperty('inOrdersCapital', 150);
      });
      it('[THEN] it will return strategy with available capital property equals to the current value + (opening order quantity * limit price)', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.strategyModule).toHaveProperty('availableCapital', 550);
      });
      it('[THEN] it will return strategy with the order properties remain unchanged', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        const unchangedParts = omit(['inOrdersCapital', 'availableCapital'], strategyModule);
        expect(result.strategyModule).toEqual(expect.objectContaining(unchangedParts));
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
      it('[THEN] it will return unchanged rejected orders list', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.rejectedOrders).not.toContainEqual(orders.rejectedOrders);
      });
      it('[THEN] it will return strategy with in-orders asset quantity property equals to the current value - opening order quantity', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.strategyModule).toHaveProperty('inOrdersAssetQuantity', 7);
      });
      it('[THEN] it will return strategy with available asset quantity property equals to the current value + opening order quantity', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.strategyModule).toHaveProperty('availableAssetQuantity', 25);
      });
      it('[THEN] it will return strategy with the order properties remain unchanged', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        const unchangedParts = omit(['inOrdersAssetQuantity', 'availableAssetQuantity'], strategyModule);
        expect(result.strategyModule).toEqual(expect.objectContaining(unchangedParts));
      });
    });
  });

  describe('[GIVEN] there is no opening order with order ID that matches the cancel order', () => {
    const currentDate = new Date('2022-06-12') as ValidDate;
    const deps = { dateService: { getCurrentDate: () => currentDate } };

    const strategyModule = mockStrategyModule();

    const cancelOrder = mockPendingCancelOrder();
    const orders = { openingOrders: [], submittedOrders: [], canceledOrders: [], rejectedOrders: [] };

    describe('[WHEN] process pending CANCEL order', () => {
      it('[THEN] it will return unchanged opening, submitted, and canceled orders list', () => {
        const result = executeIo(processPendingCancelOrder(deps, strategyModule, orders, cancelOrder));

        expect(result.orders.openingOrders).toEqual(orders.openingOrders);
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
          maxRunup: 0,
        });
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
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
          maxRunup: 0,
        });
      });
      it('[THEN] it will return updated strategy module', () => {
        const result = executeIo(processPendingOrders(deps, strategyModule, orders, trades, currentPrice));

        expect(result.strategyModule).toEqual({
          ...strategyModule,
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
