import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { ValidDate } from '#shared/utils/date.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import {
  mockCanceledLimitOrder,
  mockFilledMarketOrder,
  mockOpeningLimitOrder,
  mockRejectedMarket,
  mockSubmittedCancelOrder,
  mockTriggeredOrder,
} from '#test-utils/features/shared/order.js';

import { OrderId } from '../order.js';
import { OrdersModuleDeps, buildOrdersModule } from './orders.js';

describe('UUT: Orders module', () => {
  function mockDeps(overrides?: DeepPartial<OrdersModuleDeps>): OrdersModuleDeps {
    return mergeDeepRight(
      {
        dateService: { getCurrentDate: () => new Date('2010-10-11') as ValidDate },
        generateOrderId: () => 'vu_zGKy1Em' as OrderId,
      },
      overrides ?? {},
    );
  }

  const defaultOrders = {
    openingOrders: [],
    submittedOrders: [],
    triggeredOrders: [],
    filledOrders: [],
    canceledOrders: [],
    rejectedOrders: [],
  };

  describe('UUT: Enter with market order', () => {
    describe('[WHEN] enter a trade position with market order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), defaultOrders);
        const quantity = 1;

        const result = ordersModule.enterMarket({ quantity });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user has entered trade position with market order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the market order', () => {
          const orderId = 'HefJZWTeO8' as OrderId;
          const currentDate = new Date('2011-01-01') as ValidDate;
          const deps = mockDeps({
            generateOrderId: () => orderId,
            dateService: { getCurrentDate: () => currentDate },
          });
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), defaultOrders);
          const quantity = 1;

          ordersModule.enterMarket({ quantity });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            orderSide: 'ENTRY',
            createdAt: currentDate,
            type: 'MARKET',
            quantity,
            status: 'PENDING',
          });
        });
      });
    });
    describe('[GIVEN] user has entered trade position with market order [AND] quantity of the market order has decimal digit more than base asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the market order with rouned quantity', () => {
          const symbol = mockBnbSymbol({ baseAssetPrecision: 2 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1.006;

          ordersModule.enterMarket({ quantity });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ quantity: 1.01 }));
        });
      });
    });
  });

  describe('UUT: Enter with limit order', () => {
    describe('[WHEN] enter a trade position with limit order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), defaultOrders);
        const quantity = 1;
        const limitPrice = 10;

        const result = ordersModule.enterLimit({ quantity, limitPrice });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user has entered trade position with limit order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the limit order', () => {
          const orderId = 'HefJZWTeO8' as OrderId;
          const currentDate = new Date('2011-01-01') as ValidDate;
          const deps = mockDeps({
            generateOrderId: () => orderId,
            dateService: { getCurrentDate: () => currentDate },
          });
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), defaultOrders);
          const quantity = 1;
          const limitPrice = 10;

          ordersModule.enterLimit({ quantity, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            orderSide: 'ENTRY',
            createdAt: currentDate,
            type: 'LIMIT',
            quantity,
            limitPrice,
            status: 'PENDING',
          });
        });
      });
    });
    describe('[GIVEN] user has entered trade position with limit order [AND] quantity of the limit order has decimal digit more than base asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the limit order with rouned quantity', () => {
          const symbol = mockBnbSymbol({ baseAssetPrecision: 2 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1.001;
          const limitPrice = 1;

          ordersModule.enterLimit({ quantity, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ quantity: 1 }));
        });
      });
    });
    describe('[GIVEN] user has entered trade position with limit order [AND] limit price of the limit order has decimal digit more than quote asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the limit order with rouned limit price', () => {
          const symbol = mockBnbSymbol({ quoteAssetPrecision: 3 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1;
          const limitPrice = 2.1236;

          ordersModule.enterLimit({ quantity, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ limitPrice: 2.124 }));
        });
      });
    });
  });

  describe('UUT: Enter with stop market order', () => {
    describe('[WHEN] enter a trade position with stop market order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), defaultOrders);
        const quantity = 1;
        const stopPrice = 10;

        const result = ordersModule.enterStopMarket({ quantity, stopPrice });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user has entered trade position with stop market order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop market order', () => {
          const orderId = 'HefJZWTeO8' as OrderId;
          const currentDate = new Date('2011-01-01') as ValidDate;
          const deps = mockDeps({
            generateOrderId: () => orderId,
            dateService: { getCurrentDate: () => currentDate },
          });
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), defaultOrders);
          const quantity = 1;
          const stopPrice = 10;

          ordersModule.enterStopMarket({ quantity, stopPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            orderSide: 'ENTRY',
            createdAt: currentDate,
            type: 'STOP_MARKET',
            quantity,
            stopPrice,
            status: 'PENDING',
          });
        });
      });
    });
    describe('[GIVEN] user has entered trade position with stop market order [AND] quantity of the stop market order has decimal digit more than base asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop market order with rouned quantity', () => {
          const symbol = mockBnbSymbol({ baseAssetPrecision: 2 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 3.0001;
          const stopPrice = 1;

          ordersModule.enterStopMarket({ quantity, stopPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ quantity: 3 }));
        });
      });
    });
    describe('[GIVEN] user has entered trade position with stop market order [AND] stop price of the stop market order has decimal digit more than quote asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop market order with rouned stop price', () => {
          const symbol = mockBnbSymbol({ quoteAssetPrecision: 3 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1;
          const stopPrice = 2.1236;

          ordersModule.enterStopMarket({ quantity, stopPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ stopPrice: 2.124 }));
        });
      });
    });
  });

  describe('UUT: Enter with stop limit order', () => {
    describe('[WHEN] enter a trade position with stop limit order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), defaultOrders);
        const quantity = 1;
        const stopPrice = 10;
        const limitPrice = 11;

        const result = ordersModule.enterStopLimit({ quantity, stopPrice, limitPrice });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user has entered trade position with stop limit order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop limit order', () => {
          const orderId = 'mZd22KcMTQ' as OrderId;
          const currentDate = new Date('2011-01-01') as ValidDate;
          const deps = mockDeps({
            generateOrderId: () => orderId,
            dateService: { getCurrentDate: () => currentDate },
          });
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), defaultOrders);
          const quantity = 1;
          const stopPrice = 10;
          const limitPrice = 11;

          ordersModule.enterStopLimit({ quantity, stopPrice, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            orderSide: 'ENTRY',
            createdAt: currentDate,
            type: 'STOP_LIMIT',
            quantity,
            stopPrice,
            limitPrice,
            status: 'PENDING',
          });
        });
      });
    });
    describe('[GIVEN] user has entered trade position with stop limit order [AND] quantity of the stop limit order has decimal digit more than base asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop limit order with rouned quantity', () => {
          const symbol = mockBnbSymbol({ baseAssetPrecision: 2 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 3.0001;
          const stopPrice = 10;
          const limitPrice = 11;

          ordersModule.enterStopLimit({ quantity, stopPrice, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ quantity: 3 }));
        });
      });
    });
    describe('[GIVEN] user has entered trade position with stop limit order [AND] stop price of the stop limit order has decimal digit more than quote asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop limit order with rouned stop price', () => {
          const symbol = mockBnbSymbol({ quoteAssetPrecision: 3 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1;
          const stopPrice = 2.1236;
          const limitPrice = 11;

          ordersModule.enterStopLimit({ quantity, stopPrice, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ stopPrice: 2.124 }));
        });
      });
    });
    describe('[GIVEN] user has entered trade position with stop limit order [AND] limit price of the stop limit order has decimal digit more than quote asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop limit order with rouned limit price', () => {
          const symbol = mockBnbSymbol({ quoteAssetPrecision: 3 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1;
          const stopPrice = 2;
          const limitPrice = 5.2432;

          ordersModule.enterStopLimit({ quantity, stopPrice, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ limitPrice: 5.243 }));
        });
      });
    });
  });

  describe('UUT: Exit with market order', () => {
    describe('[WHEN] exit a trade position with market order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), defaultOrders);
        const quantity = 1;

        const result = ordersModule.exitMarket({ quantity });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user has exited trade position with market order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the market order', () => {
          const orderId = 'HefJZWTeO8' as OrderId;
          const currentDate = new Date('2011-01-01') as ValidDate;
          const deps = mockDeps({
            generateOrderId: () => orderId,
            dateService: { getCurrentDate: () => currentDate },
          });
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), defaultOrders);
          const quantity = 1;

          ordersModule.exitMarket({ quantity });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            orderSide: 'EXIT',
            createdAt: currentDate,
            type: 'MARKET',
            quantity,
            status: 'PENDING',
          });
        });
      });
    });
    describe('[GIVEN] user has exited trade position with market order [AND] quantity of the market order has decimal digit more than base asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the market order with rouned quantity', () => {
          const symbol = mockBnbSymbol({ baseAssetPrecision: 2 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1.006;

          ordersModule.exitMarket({ quantity });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ quantity: 1.01 }));
        });
      });
    });
  });

  describe('UUT: Exit with limit order', () => {
    describe('[WHEN] exit a trade position with limit order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), defaultOrders);
        const quantity = 1;
        const limitPrice = 10;

        const result = ordersModule.exitLimit({ quantity, limitPrice });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user has exited trade position with limit order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the limit order', () => {
          const orderId = 'HefJZWTeO8' as OrderId;
          const currentDate = new Date('2011-01-01') as ValidDate;
          const deps = mockDeps({
            generateOrderId: () => orderId,
            dateService: { getCurrentDate: () => currentDate },
          });
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), defaultOrders);
          const quantity = 1;
          const limitPrice = 10;

          ordersModule.exitLimit({ quantity, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            orderSide: 'EXIT',
            createdAt: currentDate,
            type: 'LIMIT',
            quantity,
            limitPrice,
            status: 'PENDING',
          });
        });
      });
    });
    describe('[GIVEN] user has exited trade position with limit order [AND] quantity of the limit order has decimal digit more than base asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the limit order with rouned quantity', () => {
          const symbol = mockBnbSymbol({ baseAssetPrecision: 2 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1.001;
          const limitPrice = 1;

          ordersModule.exitLimit({ quantity, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ quantity: 1 }));
        });
      });
    });
    describe('[GIVEN] user has exited trade position with limit order [AND] limit price of the limit order has decimal digit more than quote asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the limit order with rouned limit price', () => {
          const symbol = mockBnbSymbol({ quoteAssetPrecision: 3 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1;
          const limitPrice = 2.1236;

          ordersModule.exitLimit({ quantity, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ limitPrice: 2.124 }));
        });
      });
    });
  });

  describe('UUT: Exit with stop market order', () => {
    describe('[WHEN] exit a trade position with stop market order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), defaultOrders);
        const quantity = 1;
        const stopPrice = 10;

        const result = ordersModule.exitStopMarket({ quantity, stopPrice });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user has exited trade position with stop market order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop market order', () => {
          const orderId = 'HefJZWTeO8' as OrderId;
          const currentDate = new Date('2011-01-01') as ValidDate;
          const deps = mockDeps({
            generateOrderId: () => orderId,
            dateService: { getCurrentDate: () => currentDate },
          });
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), defaultOrders);
          const quantity = 1;
          const stopPrice = 10;

          ordersModule.exitStopMarket({ quantity, stopPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            orderSide: 'EXIT',
            createdAt: currentDate,
            type: 'STOP_MARKET',
            quantity,
            stopPrice,
            status: 'PENDING',
          });
        });
      });
    });
    describe('[GIVEN] user has exited trade position with stop market order [AND] quantity of the stop market order has decimal digit more than base asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop market order with rouned quantity', () => {
          const symbol = mockBnbSymbol({ baseAssetPrecision: 2 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 3.0001;
          const stopPrice = 1;

          ordersModule.exitStopMarket({ quantity, stopPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ quantity: 3 }));
        });
      });
    });
    describe('[GIVEN] user has exited trade position with stop market order [AND] stop price of the stop market order has decimal digit more than quote asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop market order with rouned stop price', () => {
          const symbol = mockBnbSymbol({ quoteAssetPrecision: 3 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1;
          const stopPrice = 2.1236;

          ordersModule.exitStopMarket({ quantity, stopPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ stopPrice: 2.124 }));
        });
      });
    });
  });

  describe('UUT: Exit with stop limit order', () => {
    describe('[WHEN] exit a trade position with stop limit order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), defaultOrders);
        const quantity = 1;
        const stopPrice = 10;
        const limitPrice = 11;

        const result = ordersModule.exitStopLimit({ quantity, stopPrice, limitPrice });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user has exited trade position with stop limit order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop limit order', () => {
          const orderId = 'mZd22KcMTQ' as OrderId;
          const currentDate = new Date('2011-01-01') as ValidDate;
          const deps = mockDeps({
            generateOrderId: () => orderId,
            dateService: { getCurrentDate: () => currentDate },
          });
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), defaultOrders);
          const quantity = 1;
          const stopPrice = 10;
          const limitPrice = 11;

          ordersModule.exitStopLimit({ quantity, stopPrice, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            orderSide: 'EXIT',
            createdAt: currentDate,
            type: 'STOP_LIMIT',
            quantity,
            stopPrice,
            limitPrice,
            status: 'PENDING',
          });
        });
      });
    });
    describe('[GIVEN] user has entered trade position with stop limit order [AND] quantity of the stop limit order has decimal digit more than base asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop limit order with rouned quantity', () => {
          const symbol = mockBnbSymbol({ baseAssetPrecision: 2 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 3.0001;
          const stopPrice = 10;
          const limitPrice = 11;

          ordersModule.exitStopLimit({ quantity, stopPrice, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ quantity: 3 }));
        });
      });
    });
    describe('[GIVEN] user has entered trade position with stop limit order [AND] stop price of the stop limit order has decimal digit more than quote asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop limit order with rouned stop price', () => {
          const symbol = mockBnbSymbol({ quoteAssetPrecision: 3 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1;
          const stopPrice = 2.1236;
          const limitPrice = 11;

          ordersModule.exitStopLimit({ quantity, stopPrice, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ stopPrice: 2.124 }));
        });
      });
    });
    describe('[GIVEN] user has entered trade position with stop limit order [AND] limit price of the stop limit order has decimal digit more than quote asset precision', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the stop limit order with rouned limit price', () => {
          const symbol = mockBnbSymbol({ quoteAssetPrecision: 3 });
          const ordersModule = buildOrdersModule(mockDeps(), symbol, defaultOrders);
          const quantity = 1;
          const stopPrice = 2;
          const limitPrice = 5.2432;

          ordersModule.exitStopLimit({ quantity, stopPrice, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual(expect.objectContaining({ limitPrice: 5.243 }));
        });
      });
    });
  });

  describe('UUT: Cancel an order', () => {
    describe('[WHEN] cancal an order', () => {
      it('[THEN] it will return undefined', () => {
        const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), defaultOrders);
        const orderId = 'EWT5hVH2hR' as OrderId;

        const result = ordersModule.cancelOrder(orderId);

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user has canceled an order using non-existing order ID', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return unchanged array', () => {
          const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), defaultOrders);
          const prevPending = ordersModule.getPendingOrders();

          ordersModule.cancelOrder('EWT5hVH2hR' as OrderId);

          const result = ordersModule.getPendingOrders();

          expect(result).toEqual(prevPending);
        });
      });
    });
    describe('[GIVEN] user has entered an order [AND] user canceled the order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array without the canceled order', () => {
          const enterOrderId = 'z1gPtIqn2a' as OrderId;
          const cancelOrderId = 'biQRjahlhS' as OrderId;
          const deps = mockDeps({
            generateOrderId: jest.fn().mockReturnValueOnce(enterOrderId).mockReturnValue(cancelOrderId),
          });
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), defaultOrders);

          ordersModule.enterMarket({ quantity: 1.2 });
          ordersModule.cancelOrder(enterOrderId);

          const result = ordersModule.getPendingOrders();

          expect(result).toEqual([]);
        });
      });
    });
    describe('[GIVEN] there was a opening order [AND] user canceled the opening order using order ID', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with a new cancel order', () => {
          const cancelOrderId = 'LsztardtH2' as OrderId;
          const currentDate = new Date('2022-10-09') as ValidDate;
          const deps = mockDeps({
            generateOrderId: () => cancelOrderId,
            dateService: { getCurrentDate: () => currentDate },
          });
          const openingOrderId = 'fjiO-5em-x' as OrderId;
          const openingOrders = [mockOpeningLimitOrder({ id: openingOrderId, orderSide: 'ENTRY' })];
          const orders = { ...defaultOrders, openingOrders };
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), orders);

          ordersModule.cancelOrder(openingOrderId);

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: cancelOrderId,
            createdAt: currentDate,
            type: 'CANCEL',
            orderIdToCancel: openingOrderId,
            status: 'PENDING',
          });
        });
      });
    });
    describe('[GIVEN] there was a opening order [AND] user canceled the opening order using order ID [AND] user canceled the same order ID again', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with only one cancel order', () => {
          const cancelOrderId = 'LsztardtH2' as OrderId;
          const currentDate = new Date('2022-10-09') as ValidDate;
          const deps = mockDeps({
            generateOrderId: () => cancelOrderId,
            dateService: { getCurrentDate: () => currentDate },
          });
          const openingOrderId = 'fjiO-5em-x' as OrderId;
          const openingOrders = [mockOpeningLimitOrder({ id: openingOrderId, orderSide: 'ENTRY' })];
          const orders = { ...defaultOrders, openingOrders };
          const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), orders);

          ordersModule.cancelOrder(openingOrderId);
          ordersModule.cancelOrder(openingOrderId);

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: cancelOrderId,
            createdAt: currentDate,
            type: 'CANCEL',
            orderIdToCancel: openingOrderId,
            status: 'PENDING',
          });
        });
      });
    });
  });

  describe('UUT: Cancel all orders', () => {
    function setupOrders() {
      const openingOrderId = 'GJl3A6d7hT' as OrderId;
      const openingEntryOrderId = 'cZ5iarVvKg' as OrderId;
      const openingExitOrderId = 'zg3YDxr0-l' as OrderId;
      const newCancelOrder = 'z9uMERGEm' as OrderId;
      const currentDate = new Date('2019-10-12') as ValidDate;
      const deps = mockDeps({
        generateOrderId: () => newCancelOrder,
        dateService: { getCurrentDate: () => currentDate },
      });
      const openingOrders = [
        mockOpeningLimitOrder({ id: openingOrderId, orderSide: 'ENTRY' }),
        mockOpeningLimitOrder({ id: openingEntryOrderId, orderSide: 'ENTRY' }),
        mockOpeningLimitOrder({ id: openingExitOrderId, orderSide: 'EXIT' }),
      ];
      const orders = { ...defaultOrders, openingOrders };
      const ordersModule = buildOrdersModule(deps, mockBnbSymbol(), orders);

      ordersModule.enterMarket({ quantity: 1 });
      ordersModule.exitMarket({ quantity: 1 });
      ordersModule.cancelOrder(openingOrderId);

      return { ordersModule, openingEntryOrderId, openingExitOrderId, newCancelOrder, currentDate };
    }

    describe('[WHEN] cancal all orders', () => {
      it('[THEN] it will return undefined', () => {
        const { ordersModule } = setupOrders();

        const result = ordersModule.cancelAllOrders();

        expect(result).toBeUndefined();
      });
    });

    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using type = ['ENTRY', 'EXIT', 'CANCEL'] and status = 'PENDING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an empty array', () => {
          const { ordersModule } = setupOrders();
          ordersModule.cancelAllOrders({ status: 'PENDING' });

          const result = ordersModule.getPendingOrders();

          expect(result).toEqual([]);
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using type = ['ENTRY'] and status = 'PENDING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with only exit and cancel orders', () => {
          const { ordersModule } = setupOrders();
          ordersModule.cancelAllOrders({ type: ['ENTRY'], status: 'PENDING' });

          const result = ordersModule.getPendingOrders();

          expect(result).not.toPartiallyContain({ orderSide: 'ENTRY' });
          expect(result).toIncludeAllPartialMembers([{ orderSide: 'EXIT' }, { type: 'CANCEL' }]);
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using type = ['EXIT'] and status = 'PENDING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with only entry and cancel orders', () => {
          const { ordersModule } = setupOrders();
          ordersModule.cancelAllOrders({ type: ['EXIT'], status: 'PENDING' });

          const result = ordersModule.getPendingOrders();

          expect(result).not.toPartiallyContain({ orderSide: 'EXIT' });
          expect(result).toIncludeAllPartialMembers([{ orderSide: 'ENTRY' }, { type: 'CANCEL' }]);
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using type = ['CANCEL'] and status = 'PENDING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with only entry and exit orders', () => {
          const { ordersModule } = setupOrders();
          ordersModule.cancelAllOrders({ type: ['CANCEL'], status: 'PENDING' });

          const result = ordersModule.getPendingOrders();

          expect(result).not.toPartiallyContain({ type: 'CANCEL' });
          expect(result).toIncludeAllPartialMembers([{ orderSide: 'ENTRY' }, { orderSide: 'EXIT' }]);
        });
      });
    });

    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using type = ['ENTRY', 'EXIT', 'CANCEL'] and status = 'OPENING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with a new cancel order for both opening entry and exit orders', () => {
          const { ordersModule, newCancelOrder, openingEntryOrderId, openingExitOrderId, currentDate } =
            setupOrders();
          ordersModule.cancelAllOrders({ status: 'OPENING' });

          const result = ordersModule.getPendingOrders();

          const cancelOrderBase = {
            id: newCancelOrder,
            createdAt: currentDate,
            type: 'CANCEL',
            status: 'PENDING',
          };
          expect(result).toHaveLength(5);
          expect(result).toIncludeAllMembers([
            { ...cancelOrderBase, orderIdToCancel: openingEntryOrderId },
            { ...cancelOrderBase, orderIdToCancel: openingExitOrderId },
          ]);
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using type = ['ENTRY'] and status = 'OPENING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with a new cancel order for only opening entry order', () => {
          const { ordersModule, newCancelOrder, openingEntryOrderId, currentDate } = setupOrders();
          ordersModule.cancelAllOrders({ type: ['ENTRY'], status: 'OPENING' });

          const result = ordersModule.getPendingOrders();

          expect(result).toHaveLength(4);
          expect(result).toContainEqual({
            id: newCancelOrder,
            createdAt: currentDate,
            type: 'CANCEL',
            status: 'PENDING',
            orderIdToCancel: openingEntryOrderId,
          });
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using type = ['EXIT'] and status = 'OPENING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with a new cancel order for only opening entry order', () => {
          const { ordersModule, newCancelOrder, openingExitOrderId, currentDate } = setupOrders();
          ordersModule.cancelAllOrders({ type: ['EXIT'], status: 'OPENING' });

          const result = ordersModule.getPendingOrders();

          expect(result).toHaveLength(4);
          expect(result).toContainEqual({
            id: newCancelOrder,
            createdAt: currentDate,
            type: 'CANCEL',
            status: 'PENDING',
            orderIdToCancel: openingExitOrderId,
          });
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using type = ['CANCEL'] and status = 'OPENING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array without any new cancel order', () => {
          const { ordersModule, openingEntryOrderId, openingExitOrderId } = setupOrders();
          ordersModule.cancelAllOrders({ type: ['CANCEL'], status: 'OPENING' });

          const result = ordersModule.getPendingOrders();

          expect(result).toHaveLength(3);
          expect(result).not.toPartiallyContain({ orderIdToCancel: openingEntryOrderId });
          expect(result).not.toPartiallyContain({ orderIdToCancel: openingExitOrderId });
        });
      });
    });
  });

  describe('UUT: Get submitted orders', () => {
    describe('[GIVEN] built orders module with some submitted orders', () => {
      describe('[WHEN] get submitted orders', () => {
        it('[THEN] it will return the given submitted orders', () => {
          const submittedOrders = [mockSubmittedCancelOrder()];
          const orders = { ...defaultOrders, submittedOrders };
          const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), orders);

          const result = ordersModule.getSubmittedOrders();

          expect(result).toEqual(submittedOrders);
        });
      });
    });
  });

  describe('UUT: Get opening orders', () => {
    describe('[GIVEN] built orders module with some opening orders', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return the given opening orders', () => {
          const openingOrders = [mockOpeningLimitOrder({ orderSide: 'ENTRY' })];
          const orders = { ...defaultOrders, openingOrders };
          const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), orders);

          const result = ordersModule.getOpeningOrders();

          expect(result).toEqual(openingOrders);
        });
      });
    });
  });

  describe('UUT: Get triggered orders', () => {
    describe('[GIVEN] built orders module with some triggered orders', () => {
      describe('[WHEN] get triggered orders', () => {
        it('[THEN] it will return the given triggered orders', () => {
          const triggeredOrders = [mockTriggeredOrder()];
          const orders = { ...defaultOrders, triggeredOrders };
          const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), orders);

          const result = ordersModule.getTriggeredOrders();

          expect(result).toEqual(triggeredOrders);
        });
      });
    });
  });

  describe('UUT: Get filled orders', () => {
    describe('[GIVEN] built orders module with some filled orders', () => {
      describe('[WHEN] get filled orders', () => {
        it('[THEN] it will return the given filled orders', () => {
          const filledOrders = [mockFilledMarketOrder()];
          const orders = { ...defaultOrders, filledOrders };
          const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), orders);

          const result = ordersModule.getFilledOrders();

          expect(result).toEqual(filledOrders);
        });
      });
    });
  });

  describe('UUT: Get canceled orders', () => {
    describe('[GIVEN] built orders module with some canceled orders', () => {
      describe('[WHEN] get canceled orders', () => {
        it('[THEN] it will return the given canceled orders', () => {
          const canceledOrders = [mockCanceledLimitOrder()];
          const orders = { ...defaultOrders, canceledOrders };
          const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), orders);

          const result = ordersModule.getCanceledOrders();

          expect(result).toEqual(canceledOrders);
        });
      });
    });
  });

  describe('UUT: Get rejected orders', () => {
    describe('[GIVEN] built orders module with some rejected orders', () => {
      describe('[WHEN] get rejected orders', () => {
        it('[THEN] it will return the given rejected orders', () => {
          const rejectedOrders = [mockRejectedMarket()];
          const orders = { ...defaultOrders, rejectedOrders };
          const ordersModule = buildOrdersModule(mockDeps(), mockBnbSymbol(), orders);

          const result = ordersModule.getRejectedOrders();

          expect(result).toEqual(rejectedOrders);
        });
      });
    });
  });
});
