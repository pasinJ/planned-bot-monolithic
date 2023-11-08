import { dissoc, mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { generateTradeId } from '#features/shared/trade.js';
import { dateService } from '#infra/services/date/service.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeIo } from '#shared/utils/fp.js';
import { mockKline } from '#test-utils/features/shared/kline.js';
import {
  mockFilledMarketOrder,
  mockOpeningLimitOrder,
  mockOpeningStopLimitOrder,
  mockOpeningStopMarketOrder,
} from '#test-utils/features/shared/order.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategyModule.js';
import { mockOpeningTrade } from '#test-utils/features/shared/trades.js';

import {
  ProcessOpeningLimitOrderDeps,
  ProcessOpeningOrdersDeps,
  ProcessOpeningStopMarketOrderDeps,
  processOpeningLimitOrder,
  processOpeningOrders,
  processOpeningStopLimitOrder,
  processOpeningStopMarketOrder,
} from './processOpeningOrders.js';

describe('UUT: Process opening limit order', () => {
  function mockDeps(override?: DeepPartial<ProcessOpeningLimitOrderDeps>): ProcessOpeningLimitOrderDeps {
    return mergeDeepRight<ProcessOpeningLimitOrderDeps, DeepPartial<ProcessOpeningLimitOrderDeps>>(
      { dateService, generateTradeId },
      override ?? {},
    );
  }

  describe('[GIVEN] the current kline does not cross the limit price', () => {
    describe('[WHEN] process opening limit order', () => {
      it('[THEN] it will return Right of unchanged strategy module, orders, and trades', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule();
        const orders = { filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const limitOrder = mockOpeningLimitOrder({ orderSide: 'ENTRY', limitPrice: 2 });
        const currentKline = mockKline({ open: 6, high: 8, low: 5, close: 5 });

        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        expect(result).toEqualRight({ strategyModule, orders, trades });
      });
    });
  });

  describe('[GIVEN] the current kline cross the limit price [AND] the limit order is an entry order', () => {
    const currentDate = new Date('2011-05-05') as ValidDate;
    const tradeId = generateTradeId();
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      generateTradeId: () => tradeId,
    });
    const strategyModule = mockStrategyModule({
      makerFeeRate: 1,
      totalCapital: 50,
      inOrdersCapital: 100,
      totalAssetQuantity: 10,
      availableAssetQuantity: 5,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const orders = { filledOrders: [] };
    const trades = { openingTrades: [], closedTrades: [] };
    const limitOrder = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 2, limitPrice: 4 });
    const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

    describe('[WHEN] process the opening limit order', () => {
      it('[THEN] it will return Right with updated strategy module', () => {
        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          strategyModule: {
            ...strategyModule,
            totalCapital: 42,
            inOrdersCapital: 92,
            totalAssetQuantity: 11.98,
            availableAssetQuantity: 6.98,
            totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1.02 },
          },
        });
      });
      it('[THEN] it will return Right with filled orders list that contains filled limit order', () => {
        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          orders: {
            filledOrders: expect.arrayContaining([
              {
                ...limitOrder,
                status: 'FILLED',
                filledAt: currentDate,
                filledPrice: 4,
                fee: { amount: 0.02, currency: strategyModule.assetCurrency },
              },
            ]),
          },
        });
      });
      it('[THEN] it will return Right with opening trades list that contains a new opening trade', () => {
        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        const entryOrder = {
          ...limitOrder,
          status: 'FILLED',
          filledAt: currentDate,
          filledPrice: 4,
          fee: { amount: 0.02, currency: strategyModule.assetCurrency },
        };
        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({
            openingTrades: expect.arrayContaining([
              {
                id: tradeId,
                entryOrder,
                tradeQuantity: 1.98,
                maxPrice: 5,
                minPrice: 4,
                maxRunup: 1.98,
                maxDrawdown: 0,
                unrealizedReturn: 1.98,
              },
            ]),
          }),
        });
      });
      it('[THEN] it will return Right with unchnaged closed trades list', () => {
        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({ closedTrades: trades.closedTrades }),
        });
      });
    });
  });
  describe('[GIVEN] the current kline cross the limit price [AND] the limit order is an entry order [BUT] strategy module does not have enough in-orders capital', () => {
    describe('[WHEN] process the opening limit order', () => {
      it('[THEN] it will return Left of error', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule({ inOrdersCapital: 1 });
        const orders = { filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const limitOrder = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 2, limitPrice: 4 });
        const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the current kline cross the limit price [AND] the limit order is an exit order [AND] there are enough opening trades', () => {
    const currentDate = new Date('2011-05-05') as ValidDate;
    const tradeId = generateTradeId();
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      generateTradeId: () => tradeId,
    });
    const strategyModule = mockStrategyModule({
      makerFeeRate: 1,
      totalCapital: 50,
      availableCapital: 100,
      totalAssetQuantity: 10,
      inOrdersAssetQuantity: 5,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const orders = { filledOrders: [] };
    const openingTrade = mockOpeningTrade(
      mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 2, filledPrice: 4, fee: { amount: 0 } }),
    );
    const trades = { openingTrades: [openingTrade], closedTrades: [] };
    const limitOrder = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 2, limitPrice: 8 });
    const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

    describe('[WHEN] process the opening limit order', () => {
      it('[THEN] it will return Right with updated strategy module', () => {
        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          strategyModule: {
            ...strategyModule,
            totalCapital: 65.84,
            availableCapital: 115.84,
            totalAssetQuantity: 8,
            inOrdersAssetQuantity: 3,
            totalFees: { inCapitalCurrency: 1.16, inAssetCurrency: 1 },
          },
        });
      });
      it('[THEN] it will return Right with filled orders list that contains filled limit order', () => {
        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          orders: {
            filledOrders: expect.arrayContaining([
              {
                ...limitOrder,
                status: 'FILLED',
                filledAt: currentDate,
                filledPrice: 8,
                fee: { amount: 0.16, currency: strategyModule.capitalCurrency },
              },
            ]),
          },
        });
      });
      it('[THEN] it will return Right with opening trades list that does not contain closed opening trade', () => {
        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({ openingTrades: expect.not.arrayContaining([openingTrade]) }),
        });
      });
      it('[THEN] it will return Right with closed trades list that contains a new closed trade', () => {
        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        const exitOrder = {
          ...limitOrder,
          status: 'FILLED',
          filledAt: currentDate,
          filledPrice: 8,
          fee: { amount: 0.16, currency: strategyModule.capitalCurrency },
        };
        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({
            closedTrades: expect.arrayContaining([
              {
                ...dissoc('unrealizedReturn', openingTrade),
                exitOrder,
                maxPrice: 8,
                maxRunup: 8,
                netReturn: 7.84,
              },
            ]),
          }),
        });
      });
    });
  });
  describe('[GIVEN] the current kline cross the limit price [AND] the limit order is an exit order [BUT] strategy module does not have enough in-orders asset quantity', () => {
    describe('[WHEN] process the opening limit order', () => {
      it('[THEN] it will return Left of error', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule({ inOrdersAssetQuantity: 1 });
        const orders = { filledOrders: [] };
        const openingTrade = mockOpeningTrade(
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 2, filledPrice: 4, fee: { amount: 0 } }),
        );
        const trades = { openingTrades: [openingTrade], closedTrades: [] };
        const limitOrder = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 2, limitPrice: 8 });
        const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
  describe('[GIVEN] the current kline cross the limit price [AND] the limit order is an exit order [BUT] there are not enough opening trades to fulfill the exit order', () => {
    describe('[WHEN] process the opening limit order', () => {
      it('[THEN] it will return Left of error', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule({
          inOrdersAssetQuantity: 5,
          totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
        });
        const orders = { filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const limitOrder = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 2, limitPrice: 8 });
        const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

        const result = executeIo(
          processOpeningLimitOrder(deps, strategyModule, orders, trades, limitOrder, currentKline),
        );

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
});

describe('UUT: Process opening stop market order', () => {
  function mockDeps(
    override?: DeepPartial<ProcessOpeningStopMarketOrderDeps>,
  ): ProcessOpeningStopMarketOrderDeps {
    return mergeDeepRight<ProcessOpeningStopMarketOrderDeps, DeepPartial<ProcessOpeningStopMarketOrderDeps>>(
      { dateService, generateTradeId },
      override ?? {},
    );
  }

  describe('[GIVEN] the current kline does not cross the stop price', () => {
    describe('[WHEN] process opening stop market order', () => {
      it('[THEN] it will return Right of unchanged strategy module, orders, and trades', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule();
        const orders = { filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const stopMarketOrder = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', stopPrice: 2 });
        const currentKline = mockKline({ open: 6, high: 8, low: 5, close: 5 });

        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        expect(result).toEqualRight({ strategyModule, orders, trades });
      });
    });
  });

  describe('[GIVEN] the current kline cross the stop price [AND] the stop market order is an entry order', () => {
    const currentDate = new Date('2011-05-05') as ValidDate;
    const tradeId = generateTradeId();
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      generateTradeId: () => tradeId,
    });
    const strategyModule = mockStrategyModule({
      takerFeeRate: 1,
      totalCapital: 50,
      inOrdersCapital: 100,
      totalAssetQuantity: 10,
      availableAssetQuantity: 5,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const orders = { filledOrders: [] };
    const trades = { openingTrades: [], closedTrades: [] };
    const stopMarketOrder = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', quantity: 2, stopPrice: 4 });
    const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

    describe('[WHEN] process the opening stop market order', () => {
      it('[THEN] it will return Right with updated strategy module', () => {
        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          strategyModule: {
            ...strategyModule,
            totalCapital: 42,
            inOrdersCapital: 92,
            totalAssetQuantity: 11.98,
            availableAssetQuantity: 6.98,
            totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1.02 },
          },
        });
      });
      it('[THEN] it will return Right with filled orders list that contains filled limit order', () => {
        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          orders: {
            filledOrders: expect.arrayContaining([
              {
                ...stopMarketOrder,
                status: 'FILLED',
                filledAt: currentDate,
                filledPrice: 4,
                fee: { amount: 0.02, currency: strategyModule.assetCurrency },
              },
            ]),
          },
        });
      });
      it('[THEN] it will return Right with opening trades list that contains a new opening trade', () => {
        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        const entryOrder = {
          ...stopMarketOrder,
          status: 'FILLED',
          filledAt: currentDate,
          filledPrice: 4,
          fee: { amount: 0.02, currency: strategyModule.assetCurrency },
        };
        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({
            openingTrades: expect.arrayContaining([
              {
                id: tradeId,
                entryOrder,
                tradeQuantity: 1.98,
                maxPrice: 5,
                minPrice: 4,
                maxRunup: 1.98,
                maxDrawdown: 0,
                unrealizedReturn: 1.98,
              },
            ]),
          }),
        });
      });
      it('[THEN] it will return Right with unchnaged closed trades list', () => {
        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({ closedTrades: trades.closedTrades }),
        });
      });
    });
  });
  describe('[GIVEN] the current kline cross the stop price [AND] the stop market order is an entry order [BUT] strategy module does not have enough in-orders capital', () => {
    describe('[WHEN] process the opening stop market order', () => {
      it('[THEN] it will return Left of error', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule({ inOrdersCapital: 1 });
        const orders = { filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const stopMarketOrder = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', quantity: 2, stopPrice: 4 });
        const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the current kline cross the stop price [AND] the stop market order is an exit order [AND] there are enough opening trades', () => {
    const currentDate = new Date('2011-05-05') as ValidDate;
    const tradeId = generateTradeId();
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      generateTradeId: () => tradeId,
    });
    const strategyModule = mockStrategyModule({
      takerFeeRate: 1,
      totalCapital: 50,
      availableCapital: 100,
      totalAssetQuantity: 10,
      inOrdersAssetQuantity: 5,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const orders = { filledOrders: [] };
    const openingTrade = mockOpeningTrade(
      mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 2, filledPrice: 4, fee: { amount: 0 } }),
    );
    const trades = { openingTrades: [openingTrade], closedTrades: [] };
    const stopMarketOrder = mockOpeningStopMarketOrder({ orderSide: 'EXIT', quantity: 2, stopPrice: 8 });
    const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

    describe('[WHEN] process the opening stop market order', () => {
      it('[THEN] it will return Right with updated strategy module', () => {
        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          strategyModule: {
            ...strategyModule,
            totalCapital: 65.84,
            availableCapital: 115.84,
            totalAssetQuantity: 8,
            inOrdersAssetQuantity: 3,
            totalFees: { inCapitalCurrency: 1.16, inAssetCurrency: 1 },
          },
        });
      });
      it('[THEN] it will return Right with filled orders list that contains filled limit order', () => {
        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          orders: {
            filledOrders: expect.arrayContaining([
              {
                ...stopMarketOrder,
                status: 'FILLED',
                filledAt: currentDate,
                filledPrice: 8,
                fee: { amount: 0.16, currency: strategyModule.capitalCurrency },
              },
            ]),
          },
        });
      });
      it('[THEN] it will return Right with opening trades list that does not contain closed opening trade', () => {
        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({ openingTrades: expect.not.arrayContaining([openingTrade]) }),
        });
      });
      it('[THEN] it will return Right with closed trades list that contains a new closed trade', () => {
        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        const exitOrder = {
          ...stopMarketOrder,
          status: 'FILLED',
          filledAt: currentDate,
          filledPrice: 8,
          fee: { amount: 0.16, currency: strategyModule.capitalCurrency },
        };
        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({
            closedTrades: expect.arrayContaining([
              {
                ...dissoc('unrealizedReturn', openingTrade),
                exitOrder,
                maxPrice: 8,
                maxRunup: 8,
                netReturn: 7.84,
              },
            ]),
          }),
        });
      });
    });
  });
  describe('[GIVEN] the current kline cross the stop price [AND] the stop market order is an exit order [BUT] strategy module does not have enough in-orders asset quantity', () => {
    describe('[WHEN] process the opening stop market order', () => {
      it('[THEN] it will return Left of error', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule({ inOrdersAssetQuantity: 1 });
        const orders = { filledOrders: [] };
        const openingTrade = mockOpeningTrade(
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 2, filledPrice: 4, fee: { amount: 0 } }),
        );
        const trades = { openingTrades: [openingTrade], closedTrades: [] };
        const stopMarketOrder = mockOpeningStopMarketOrder({ orderSide: 'EXIT', quantity: 2, stopPrice: 8 });
        const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
  describe('[GIVEN] the current kline cross the stop price [AND] the stop market order is an exit order [BUT] there are not enough opening trades to fulfill the exit order', () => {
    describe('[WHEN] process the opening stop market order', () => {
      it('[THEN] it will return Left of error', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule({
          inOrdersAssetQuantity: 5,
          totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
        });
        const orders = { filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const stopMarketOrder = mockOpeningStopMarketOrder({ orderSide: 'EXIT', quantity: 2, stopPrice: 8 });
        const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

        const result = executeIo(
          processOpeningStopMarketOrder(deps, strategyModule, orders, trades, stopMarketOrder, currentKline),
        );

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
});

describe('UUT: Process opening stop limit order', () => {
  describe('[GIVEN] the current kline does not cross the stop price', () => {
    describe('[WHEN] process opening stop limit order', () => {
      it('[THEN] it will return unchanged triggered orders list', () => {
        const orders = { triggeredOrders: [] };
        const stopLimitOrder = mockOpeningStopLimitOrder({ orderSide: 'ENTRY', stopPrice: 2, limitPrice: 1 });
        const currentKline = mockKline({ open: 6, high: 8, low: 5, close: 5 });

        const result = processOpeningStopLimitOrder(orders, stopLimitOrder, currentKline);

        expect(result).toEqual({ orders });
      });
    });
  });

  describe('[GIVEN] the current kline cross the stop price', () => {
    describe('[WHEN] process opening stop limit order', () => {
      it('[THEN] it will return triggered orders list that contains a triggered stop limit order', () => {
        const orders = { triggeredOrders: [] };
        const stopLimitOrder = mockOpeningStopLimitOrder({ orderSide: 'ENTRY', stopPrice: 2, limitPrice: 1 });
        const currentKline = mockKline({ open: 6, high: 8, low: 2, close: 5 });

        const result = processOpeningStopLimitOrder(orders, stopLimitOrder, currentKline);

        expect(result).toEqual({
          orders: { triggeredOrders: expect.arrayContaining([{ ...stopLimitOrder, status: 'TRIGGERED' }]) },
        });
      });
    });
  });
});

describe('UUT: Process opening orders', () => {
  function mockDeps(override?: DeepPartial<ProcessOpeningOrdersDeps>): ProcessOpeningOrdersDeps {
    return mergeDeepRight<ProcessOpeningOrdersDeps, DeepPartial<ProcessOpeningOrdersDeps>>(
      { dateService, generateTradeId },
      override ?? {},
    );
  }

  describe('[GIVEN] opening orders list is empty', () => {
    describe('[WHEN] process opening orders', () => {
      it('[THEN] it will return Right of unchanged strategy module, orders lists, and trades lists', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule();
        const orders = { openingOrders: [], triggeredOrders: [], filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const currentKline = mockKline();

        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toEqualRight({ strategyModule, orders, trades });
      });
    });
  });

  describe('[GIVEN] opening orders list contains a limit entry order [AND] the current kline crosses the limit price of the order', () => {
    const currentDate = new Date('2011-05-05') as ValidDate;
    const tradeId = generateTradeId();
    const deps = mockDeps({
      dateService: { getCurrentDate: () => currentDate },
      generateTradeId: () => tradeId,
    });
    const strategyModule = mockStrategyModule({
      makerFeeRate: 1,
      totalCapital: 50,
      inOrdersCapital: 100,
      totalAssetQuantity: 10,
      availableAssetQuantity: 5,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const limitOrder = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 2, limitPrice: 4 });
    const orders = { openingOrders: [limitOrder], triggeredOrders: [], filledOrders: [] };
    const trades = { openingTrades: [], closedTrades: [] };
    const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

    describe('[WHEN] process opening orders', () => {
      it('[THEN] it will return Right with updated strategy module', () => {
        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          strategyModule: {
            ...strategyModule,
            totalCapital: 42,
            inOrdersCapital: 92,
            totalAssetQuantity: 11.98,
            availableAssetQuantity: 6.98,
            totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1.02 },
          },
        });
      });
      it('[THEN] it will return Right with filled orders list that contains filled limit order', () => {
        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          orders: {
            filledOrders: expect.arrayContaining([
              {
                ...limitOrder,
                status: 'FILLED',
                filledAt: currentDate,
                filledPrice: 4,
                fee: { amount: 0.02, currency: strategyModule.assetCurrency },
              },
            ]),
          },
        });
      });
      it('[THEN] it will return Right with opening orders list that does not contain the limit order', () => {
        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          orders: expect.objectContaining({ openingOrders: expect.not.arrayContaining([limitOrder]) }),
        });
      });
      it('[THEN] it will return Right with unchnaged triggered orders list', () => {
        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          orders: expect.objectContaining({ triggeredOrders: orders.triggeredOrders }),
        });
      });
      it('[THEN] it will return Right with opening trades list that contains a new opening trade', () => {
        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        const entryOrder = {
          ...limitOrder,
          status: 'FILLED',
          filledAt: currentDate,
          filledPrice: 4,
          fee: { amount: 0.02, currency: strategyModule.assetCurrency },
        };
        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({
            openingTrades: expect.arrayContaining([
              {
                id: tradeId,
                entryOrder,
                tradeQuantity: 1.98,
                maxPrice: 5,
                minPrice: 4,
                maxRunup: 1.98,
                maxDrawdown: 0,
                unrealizedReturn: 1.98,
              },
            ]),
          }),
        });
      });
      it('[THEN] it will return Right with unchnaged closed trades list', () => {
        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({ closedTrades: trades.closedTrades }),
        });
      });
    });
  });
  describe('[GIVEN] opening orders list contains a limit entry order [AND] the current kline does not cross the limit price of the order', () => {
    const deps = mockDeps();
    const strategyModule = mockStrategyModule({ inOrdersCapital: 100 });
    const limitOrder = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 2, limitPrice: 4 });
    const orders = { openingOrders: [limitOrder], triggeredOrders: [], filledOrders: [] };
    const trades = { openingTrades: [], closedTrades: [] };
    const currentKline = mockKline({ open: 6, high: 12, low: 5, close: 5 });

    describe('[WHEN] process opening orders', () => {
      it('[THEN] it will return Right with unchanged strategy module', () => {
        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({ strategyModule });
      });
      it('[THEN] it will return Right with opening orders list that still contains the limit order', () => {
        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({ orders: { openingOrders: expect.arrayContaining([limitOrder]) } });
      });
      it('[THEN] it will return Right with unchnaged filled and triggered orders list', () => {
        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          orders: expect.objectContaining({
            triggeredOrders: orders.triggeredOrders,
            filledOrders: orders.filledOrders,
          }),
        });
      });
      it('[THEN] it will return Right with unchanged opening and closed trades lists', () => {
        const result = executeIo(processOpeningOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({
            openingTrades: trades.openingTrades,
            closedTrades: trades.closedTrades,
          }),
        });
      });
    });
  });
});
