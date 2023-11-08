import { dissoc, mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { generateTradeId } from '#features/shared/trade.js';
import { dateService } from '#infra/services/date/service.js';
import { isGeneralError } from '#shared/errors/generalError.js';
import { ValidDate } from '#shared/utils/date.js';
import { executeIo } from '#shared/utils/fp.js';
import { mockKline } from '#test-utils/features/shared/kline.js';
import { mockFilledMarketOrder, mockTriggeredOrder } from '#test-utils/features/shared/order.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategyModule.js';
import { mockOpeningTrade } from '#test-utils/features/shared/trades.js';

import {
  ProcessTriggeredOrdersDeps,
  ProcessTriggeredStopLimitOrderDeps,
  processTriggeredOrders,
  processTriggeredStopLimitOrder,
} from './processTriggeredOrders.js';

describe('UUT: Process stop market triggered order', () => {
  function mockDeps(
    override?: DeepPartial<ProcessTriggeredStopLimitOrderDeps>,
  ): ProcessTriggeredStopLimitOrderDeps {
    return mergeDeepRight<
      ProcessTriggeredStopLimitOrderDeps,
      DeepPartial<ProcessTriggeredStopLimitOrderDeps>
    >({ dateService, generateTradeId }, override ?? {});
  }

  describe('[GIVEN] the current kline does not cross the stop price', () => {
    describe('[WHEN] process triggered stop limit order', () => {
      it('[THEN] it will return Right of unchanged strategy module, orders, and trades', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule();
        const orders = { filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const stopLimitOrder = mockTriggeredOrder({ orderSide: 'ENTRY', stopPrice: 5, limitPrice: 4 });
        const currentKline = mockKline({ open: 6, high: 8, low: 5, close: 5 });

        const result = executeIo(
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
        );

        expect(result).toEqualRight({ strategyModule, orders, trades });
      });
    });
  });

  describe('[GIVEN] the current kline cross the limit price [AND] the stop limit order is an entry order', () => {
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
    const stopLimitOrder = mockTriggeredOrder({
      orderSide: 'ENTRY',
      quantity: 2,
      stopPrice: 5,
      limitPrice: 4,
    });
    const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

    describe('[WHEN] triggered stop limit order', () => {
      it('[THEN] it will return Right with updated strategy module', () => {
        const result = executeIo(
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
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
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          orders: {
            filledOrders: expect.arrayContaining([
              {
                ...stopLimitOrder,
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
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
        );

        const entryOrder = {
          ...stopLimitOrder,
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
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({ closedTrades: trades.closedTrades }),
        });
      });
    });
  });
  describe('[GIVEN] the current kline cross the limit price [AND] the stop limit order is an entry order [BUT] strategy module does not have enough in-orders capital', () => {
    describe('[WHEN] triggered stop limit order', () => {
      it('[THEN] it will return Left of error', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule({ inOrdersCapital: 1 });
        const orders = { filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const stopLimitOrder = mockTriggeredOrder({
          orderSide: 'ENTRY',
          quantity: 2,
          stopPrice: 5,
          limitPrice: 4,
        });
        const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

        const result = executeIo(
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
        );

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the current kline cross the limit price [AND] the stop limit order is an exit order [AND] there are enough opening trades', () => {
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
    const stopLimitOrder = mockTriggeredOrder({ orderSide: 'EXIT', quantity: 2, limitPrice: 8 });
    const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

    describe('[WHEN] process the triggered stop limit order', () => {
      it('[THEN] it will return Right with updated strategy module', () => {
        const result = executeIo(
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
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
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          orders: {
            filledOrders: expect.arrayContaining([
              {
                ...stopLimitOrder,
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
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
        );

        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({ openingTrades: expect.not.arrayContaining([openingTrade]) }),
        });
      });
      it('[THEN] it will return Right with closed trades list that contains a new closed trade', () => {
        const result = executeIo(
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
        );

        const exitOrder = {
          ...stopLimitOrder,
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
  describe('[GIVEN] the current kline cross the limit price [AND] the stop limit order is an exit order [BUT] strategy module does not have enough in-orders asset quantity', () => {
    describe('[WHEN] process the triggered stop limit order', () => {
      it('[THEN] it will return Left of error', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule({ inOrdersAssetQuantity: 1 });
        const orders = { filledOrders: [] };
        const openingTrade = mockOpeningTrade(
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 2, filledPrice: 4, fee: { amount: 0 } }),
        );
        const trades = { openingTrades: [openingTrade], closedTrades: [] };
        const stopLimitOrder = mockTriggeredOrder({ orderSide: 'EXIT', quantity: 2, limitPrice: 8 });
        const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

        const result = executeIo(
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
        );

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
  describe('[GIVEN] the current kline cross the limit price [AND] the stop limit order is an exit order [BUT] there are not enough opening trades to fulfill the exit order', () => {
    describe('[WHEN] process the triggered stop limit order', () => {
      it('[THEN] it will return Left of error', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule({
          inOrdersAssetQuantity: 5,
          totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
        });
        const orders = { filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const stopLimitOrder = mockTriggeredOrder({ orderSide: 'EXIT', quantity: 2, limitPrice: 8 });
        const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

        const result = executeIo(
          processTriggeredStopLimitOrder(deps, strategyModule, orders, trades, stopLimitOrder, currentKline),
        );

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
});

describe('UUT: Process triggered orders', () => {
  function mockDeps(override?: DeepPartial<ProcessTriggeredOrdersDeps>): ProcessTriggeredOrdersDeps {
    return mergeDeepRight<ProcessTriggeredOrdersDeps, DeepPartial<ProcessTriggeredOrdersDeps>>(
      { dateService, generateTradeId },
      override ?? {},
    );
  }

  describe('[GIVEN] opening orders list is empty', () => {
    describe('[WHEN] process opening orders', () => {
      it('[THEN] it will return Right of unchanged strategy module, orders lists, and trades lists', () => {
        const deps = mockDeps();
        const strategyModule = mockStrategyModule();
        const orders = { triggeredOrders: [], filledOrders: [] };
        const trades = { openingTrades: [], closedTrades: [] };
        const currentKline = mockKline();

        const result = executeIo(processTriggeredOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toEqualRight({ strategyModule, orders, trades });
      });
    });
  });

  describe('[GIVEN] triggered orders list contains a stop limit entry order [AND] the current kline crosses the limit price of the order', () => {
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
    const stopLimitOrder = mockTriggeredOrder({
      orderSide: 'ENTRY',
      quantity: 2,
      stopPrice: 5,
      limitPrice: 4,
    });
    const orders = { triggeredOrders: [stopLimitOrder], filledOrders: [] };
    const trades = { openingTrades: [], closedTrades: [] };
    const currentKline = mockKline({ open: 6, high: 12, low: 2, close: 5 });

    describe('[WHEN] process triggered orders', () => {
      it('[THEN] it will return Right with updated strategy module', () => {
        const result = executeIo(processTriggeredOrders(deps, strategyModule, orders, trades, currentKline));

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
      it('[THEN] it will return Right with filled orders list that contains filled stop limit order', () => {
        const result = executeIo(processTriggeredOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          orders: {
            filledOrders: expect.arrayContaining([
              {
                ...stopLimitOrder,
                status: 'FILLED',
                filledAt: currentDate,
                filledPrice: 4,
                fee: { amount: 0.02, currency: strategyModule.assetCurrency },
              },
            ]),
          },
        });
      });
      it('[THEN] it will return Right with triggered orders list that does not contain the stop limit order', () => {
        const result = executeIo(processTriggeredOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          orders: expect.objectContaining({ triggeredOrders: expect.not.arrayContaining([stopLimitOrder]) }),
        });
      });
      it('[THEN] it will return Right with opening trades list that contains a new opening trade', () => {
        const result = executeIo(processTriggeredOrders(deps, strategyModule, orders, trades, currentKline));

        const entryOrder = {
          ...stopLimitOrder,
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
        const result = executeIo(processTriggeredOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          trades: expect.objectContaining({ closedTrades: trades.closedTrades }),
        });
      });
    });
  });
  describe('[GIVEN] triggered orders list contains a limit entry order [AND] the current kline does not cross the limit price of the order', () => {
    const deps = mockDeps();
    const strategyModule = mockStrategyModule({ inOrdersCapital: 100 });
    const stopLimitOrder = mockTriggeredOrder({ orderSide: 'ENTRY', stopPrice: 5, limitPrice: 4 });
    const orders = { triggeredOrders: [stopLimitOrder], filledOrders: [] };
    const trades = { openingTrades: [], closedTrades: [] };
    const currentKline = mockKline({ open: 6, high: 8, low: 5, close: 5 });

    describe('[WHEN] process triggered orders', () => {
      it('[THEN] it will return Right with unchanged strategy module', () => {
        const result = executeIo(processTriggeredOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({ strategyModule });
      });
      it('[THEN] it will return Right with triggered orders list that still contains the limit order', () => {
        const result = executeIo(processTriggeredOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          orders: { triggeredOrders: expect.arrayContaining([stopLimitOrder]) },
        });
      });
      it('[THEN] it will return Right with unchnaged filled orders list', () => {
        const result = executeIo(processTriggeredOrders(deps, strategyModule, orders, trades, currentKline));

        expect(result).toSubsetEqualRight({
          orders: expect.objectContaining({ filledOrders: orders.filledOrders }),
        });
      });
      it('[THEN] it will return Right with unchanged opening and closed trades lists', () => {
        const result = executeIo(processTriggeredOrders(deps, strategyModule, orders, trades, currentKline));

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
