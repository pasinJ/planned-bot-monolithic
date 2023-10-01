import { utcToZonedTime } from 'date-fns-tz';
import { ReadonlyNonEmptyArray, last } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';
import { ascend, mergeDeepRight, prop, sort } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { KlineModel, Price } from '#features/btStrategies/dataModels/kline.js';
import { randomDate } from '#test-utils/faker/date.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { randomPositiveFloat } from '#test-utils/faker/number.js';
import { randomString } from '#test-utils/faker/string.js';
import { mockBtStrategy, mockKline } from '#test-utils/features/btStrategies/models.js';
import {
  mockOpeningLimitOrder,
  mockOpeningStopLimitOrder,
  mockOpeningStopMarketOrder,
  mockPendingLimitOrder,
  mockPendingMarketOrder,
  randomOrderId,
} from '#test-utils/features/shared/order.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategy.js';

import {
  OrdersModuleDeps,
  buildOrdersModule,
  calculateFee,
  createFilledOrder,
  createOpeningOrder,
  createRejectedOrder,
} from './orders.js';

describe('UUT: Orders module', () => {
  function mockDeps(overrides?: DeepPartial<OrdersModuleDeps>): OrdersModuleDeps {
    return mergeDeepRight(
      {
        generateOrderId: () => randomOrderId(),
        dateService: { getCurrentDate: () => lastKline.closeTimestamp },
      },
      overrides ?? {},
    );
  }

  const strategy = mockBtStrategy();
  const unorderedKlines = generateArrayOf(() => mockKline({ symbol: strategy.symbol }), 5);
  const klines = sort(
    ascend(prop('closeTimestamp')),
    unorderedKlines,
  ) as unknown as ReadonlyNonEmptyArray<KlineModel>;
  const lastKline = last(klines);

  describe('UUT: Enter with market order', () => {
    describe('[WHEN] enter a trade position with market order using quantity property', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.enterMarket({ quantity: randomPositiveFloat() });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user called enter trade position with market order using quantity property', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the entered market order', () => {
          const orderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => orderId });
          const ordersModule = buildOrdersModule(deps, strategy, []);
          const quantity = randomPositiveFloat();
          ordersModule.enterMarket({ quantity });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            symbol: strategy.symbol,
            orderSide: 'ENTRY',
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'MARKET',
            quantity,
            status: 'PENDING',
          });
        });
      });
    });
  });

  describe('UUT: Enter with limit order', () => {
    describe('[WHEN] enter a trade position with limit order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.enterLimit({
          quantity: randomPositiveFloat(),
          limitPrice: randomPositiveFloat(),
        });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user called enter trade position with limit order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the entered limit order', () => {
          const orderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => orderId });
          const ordersModule = buildOrdersModule(deps, strategy, []);

          const quantity = randomPositiveFloat();
          const limitPrice = randomPositiveFloat();
          ordersModule.enterLimit({ quantity, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            symbol: strategy.symbol,
            orderSide: 'ENTRY',
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'LIMIT',
            quantity,
            limitPrice,
            status: 'PENDING',
          });
        });
      });
    });
  });

  describe('UUT: Enter with stop market order', () => {
    describe('[WHEN] enter a trade position with stop market order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.enterStopMarket({
          quantity: randomPositiveFloat(),
          stopPrice: randomPositiveFloat(),
        });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user called enter trade position with stop market order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the entered limit order', () => {
          const orderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => orderId });
          const ordersModule = buildOrdersModule(deps, strategy, []);

          const quantity = randomPositiveFloat();
          const stopPrice = randomPositiveFloat();
          ordersModule.enterStopMarket({ quantity, stopPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            symbol: strategy.symbol,
            orderSide: 'ENTRY',
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'STOP_MARKET',
            quantity,
            stopPrice,
            status: 'PENDING',
          });
        });
      });
    });
  });

  describe('UUT: Enter with stop limit order', () => {
    describe('[WHEN] enter a trade position with stop limit order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.enterStopLimit({
          quantity: randomPositiveFloat(),
          stopPrice: randomPositiveFloat(),
          limitPrice: randomPositiveFloat(),
        });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user called enter trade position with stop limit order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the entered limit order', () => {
          const orderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => orderId });
          const ordersModule = buildOrdersModule(deps, strategy, []);

          const quantity = randomPositiveFloat();
          const stopPrice = randomPositiveFloat();
          const limitPrice = randomPositiveFloat();
          ordersModule.enterStopLimit({ quantity, stopPrice, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            symbol: strategy.symbol,
            orderSide: 'ENTRY',
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'STOP_LIMIT',
            quantity,
            stopPrice,
            limitPrice,
            status: 'PENDING',
          });
        });
      });
    });
  });

  describe('UUT: Exit with market order', () => {
    describe('[WHEN] exit a trade position with market order using quantity property', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.exitMarket({ quantity: randomPositiveFloat() });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user called exit trade position with market order using quantity property', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the exited market order', () => {
          const orderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => orderId });
          const ordersModule = buildOrdersModule(deps, strategy, []);
          const quantity = randomPositiveFloat();
          ordersModule.exitMarket({ quantity });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            symbol: strategy.symbol,
            orderSide: 'EXIT',
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'MARKET',
            quantity,
            status: 'PENDING',
          });
        });
      });
    });
  });

  describe('UUT: Exit with limit order', () => {
    describe('[WHEN] exit a trade position with limit order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.exitLimit({
          quantity: randomPositiveFloat(),
          limitPrice: randomPositiveFloat(),
        });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user called exit trade position with limit order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the exited limit order', () => {
          const orderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => orderId });
          const ordersModule = buildOrdersModule(deps, strategy, []);

          const quantity = randomPositiveFloat();
          const limitPrice = randomPositiveFloat();
          ordersModule.exitLimit({ quantity, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            symbol: strategy.symbol,
            orderSide: 'EXIT',
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'LIMIT',
            quantity,
            limitPrice,
            status: 'PENDING',
          });
        });
      });
    });
  });

  describe('UUT: Exit with stop market order', () => {
    describe('[WHEN] exit a trade position with stop market order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.exitStopMarket({
          quantity: randomPositiveFloat(),
          stopPrice: randomPositiveFloat(),
        });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user called exit trade position with stop market order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the exited limit order', () => {
          const orderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => orderId });
          const ordersModule = buildOrdersModule(deps, strategy, []);

          const quantity = randomPositiveFloat();
          const stopPrice = randomPositiveFloat();
          ordersModule.exitStopMarket({ quantity, stopPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            symbol: strategy.symbol,
            orderSide: 'EXIT',
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'STOP_MARKET',
            quantity,
            stopPrice,
            status: 'PENDING',
          });
        });
      });
    });
  });

  describe('UUT: Exit with stop limit order', () => {
    describe('[WHEN] exit a trade position with stop limit order', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.exitStopLimit({
          quantity: randomPositiveFloat(),
          stopPrice: randomPositiveFloat(),
          limitPrice: randomPositiveFloat(),
        });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user called exit trade position with stop limit order', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the exited limit order', () => {
          const orderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => orderId });
          const ordersModule = buildOrdersModule(deps, strategy, []);

          const quantity = randomPositiveFloat();
          const stopPrice = randomPositiveFloat();
          const limitPrice = randomPositiveFloat();
          ordersModule.exitStopLimit({ quantity, stopPrice, limitPrice });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            symbol: strategy.symbol,
            orderSide: 'EXIT',
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'STOP_LIMIT',
            quantity,
            stopPrice,
            limitPrice,
            status: 'PENDING',
          });
        });
      });
    });
  });

  describe('UUT: Cancel an order', () => {
    describe('[WHEN] cancal an order', () => {
      it('[THEN] it will return undefined', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.cancelOrder(randomOrderId());

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user canceled an order using non-existing order ID', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return unchanged array', () => {
          const ordersModule = buildOrdersModule(mockDeps(), strategy, []);
          const prevPending = ordersModule.getPendingOrders();
          ordersModule.cancelOrder(randomOrderId());

          const result = ordersModule.getPendingOrders();

          expect(result).toEqual(prevPending);
        });
      });
    });
    describe('[GIVEN] user entered an order [AND] user canceled the order using order ID', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array without the canceled order', () => {
          const ordersModule = buildOrdersModule(mockDeps(), strategy, []);
          ordersModule.enterMarket({ quantity: randomPositiveFloat() });
          const prevPending = ordersModule.getPendingOrders();
          ordersModule.cancelOrder(prevPending[0].id);

          const result = ordersModule.getPendingOrders();

          expect(result).toEqual([]);
        });
      });
    });
    describe('[GIVEN] there was a opening order [AND] user canceled the opening order using order ID', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with a new cancel order', () => {
          const openingOrderId = randomOrderId();
          const cancelOrderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => cancelOrderId });
          const ordersModule = buildOrdersModule(deps, strategy, [
            mockOpeningLimitOrder({ id: openingOrderId, orderSide: 'ENTRY' }),
          ]);
          ordersModule.cancelOrder(openingOrderId);

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: cancelOrderId,
            symbol: strategy.symbol,
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
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
          const openingOrderId = randomOrderId();
          const cancelOrderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => cancelOrderId });
          const ordersModule = buildOrdersModule(deps, strategy, [
            mockOpeningLimitOrder({ id: openingOrderId, orderSide: 'ENTRY' }),
          ]);
          ordersModule.cancelOrder(openingOrderId);
          ordersModule.cancelOrder(openingOrderId);

          const result = ordersModule.getPendingOrders();

          expect(result).toHaveLength(1);
          expect(result).toContainEqual({
            id: cancelOrderId,
            symbol: strategy.symbol,
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
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
      const openingOrderId = randomOrderId();
      const openingEntryOrderId = randomOrderId();
      const openingExitOrderId = randomOrderId();
      const newCancelOrder = randomOrderId();
      const ordersModule = buildOrdersModule(mockDeps({ generateOrderId: () => newCancelOrder }), strategy, [
        mockOpeningLimitOrder({ id: openingOrderId, orderSide: 'ENTRY' }),
        mockOpeningLimitOrder({ id: openingEntryOrderId, orderSide: 'ENTRY' }),
        mockOpeningLimitOrder({ id: openingExitOrderId, orderSide: 'EXIT' }),
      ]);
      ordersModule.enterMarket({ quantity: randomPositiveFloat() });
      ordersModule.exitMarket({ quantity: randomPositiveFloat() });
      ordersModule.cancelOrder(openingOrderId);

      return { ordersModule, openingEntryOrderId, openingExitOrderId, newCancelOrder };
    }

    describe('[WHEN] cancal all orders', () => {
      it('[THEN] it will return undefined', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.cancelAllOrders();

        expect(result).toBeUndefined();
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using side = ['ENTRY', 'EXIT', 'CANCEL'] and status = 'PENDING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an empty array', () => {
          const { ordersModule } = setupOrders();
          ordersModule.cancelAllOrders({ status: 'PENDING' });

          const result = ordersModule.getPendingOrders();

          expect(result).toEqual([]);
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using side = ['ENTRY'] and status = 'PENDING'", () => {
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
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using side = ['EXIT'] and status = 'PENDING'", () => {
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
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using side = ['CANCEL'] and status = 'PENDING'", () => {
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
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using side = ['ENTRY', 'EXIT', 'CANCEL'] and status = 'OPENING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with a new cancel order for both opening entry and exit orders', () => {
          const { ordersModule, newCancelOrder, openingEntryOrderId, openingExitOrderId } = setupOrders();
          ordersModule.cancelAllOrders({ status: 'OPENING' });

          const result = ordersModule.getPendingOrders();

          const cancelOrderBase = {
            id: newCancelOrder,
            symbol: strategy.symbol,
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
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
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using side = ['ENTRY'] and status = 'OPENING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with a new cancel order for only opening entry order', () => {
          const { ordersModule, newCancelOrder, openingEntryOrderId } = setupOrders();
          ordersModule.cancelAllOrders({ type: ['ENTRY'], status: 'OPENING' });

          const result = ordersModule.getPendingOrders();

          const cancelOrderBase = {
            id: newCancelOrder,
            symbol: strategy.symbol,
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'CANCEL',
            status: 'PENDING',
          };
          expect(result).toHaveLength(4);
          expect(result).toContainEqual({ ...cancelOrderBase, orderIdToCancel: openingEntryOrderId });
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using side = ['EXIT'] and status = 'OPENING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with a new cancel order for only opening entry order', () => {
          const { ordersModule, newCancelOrder, openingExitOrderId } = setupOrders();
          ordersModule.cancelAllOrders({ type: ['EXIT'], status: 'OPENING' });

          const result = ordersModule.getPendingOrders();

          const cancelOrderBase = {
            id: newCancelOrder,
            symbol: strategy.symbol,
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'CANCEL',
            status: 'PENDING',
          };
          expect(result).toHaveLength(4);
          expect(result).toContainEqual({ ...cancelOrderBase, orderIdToCancel: openingExitOrderId });
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using side = ['CANCEL'] and status = 'OPENING'", () => {
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

  describe('UUT: Get opening orders', () => {
    describe('[GIVEN] built orders module with some opening orders', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return the given opening orders', () => {
          const openingOrders = [
            mockOpeningLimitOrder({ orderSide: 'ENTRY' }),
            mockOpeningLimitOrder({ orderSide: 'EXIT' }),
          ];
          const ordersModule = buildOrdersModule(mockDeps(), strategy, openingOrders);

          const result = ordersModule.getOpeningOrders();

          expect(result).toEqual(openingOrders);
        });
      });
    });
  });
});

describe('UUT: Calculate fee', () => {
  describe('[GIVEN] the order is an entry MARKET order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount that calculate from taker fee rate, and asset currency', () => {
        const strategy = mockStrategyModule({ takerFeeRate: 5 });
        const order = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });
        const currentPrice = 10 as Price;

        const result = calculateFee(strategy, order, currentPrice);

        expect(result).toEqual({ amount: 0.5, currency: strategy.assetCurrency });
      });
    });
  });
  describe('[GIVEN] the order is an exit MARKET order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount that calculate from taker fee rate, and asset currency', () => {
        const strategy = mockStrategyModule({ takerFeeRate: 5 });
        const order = mockPendingMarketOrder({ orderSide: 'EXIT', quantity: 10 });
        const currentPrice = 10 as Price;

        const result = calculateFee(strategy, order, currentPrice);

        expect(result).toEqual({ amount: 5, currency: strategy.baseCurrency });
      });
    });
  });

  describe('[GIVEN] the order is an entry LIMIT order [AND] the limit price is less than the current price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount that calculate from maker fee rate, and asset currency', () => {
        const strategy = mockStrategyModule({ takerFeeRate: 1, makerFeeRate: 2 });
        const order = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 20 });
        const currentPrice = 30 as Price;

        const result = calculateFee(strategy, order, currentPrice);

        expect(result).toEqual({ amount: 0.2, currency: strategy.assetCurrency });
      });
    });
  });
  describe('[GIVEN] the order is an entry LIMIT order [AND] the limit price is greater than or equal to the current price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount that calculate from taker fee rate, and asset currency', () => {
        const strategy = mockStrategyModule({ takerFeeRate: 1, makerFeeRate: 2 });
        const order = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 20 });
        const currentPrice = 10 as Price;

        const result = calculateFee(strategy, order, currentPrice);

        expect(result).toEqual({ amount: 0.1, currency: strategy.assetCurrency });
      });
    });
  });
  describe('[GIVEN] the order is an exit LIMIT order [AND] the limit price is greater than the current price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount that calculate from maker fee rate, and asset currency', () => {
        const strategy = mockStrategyModule({ takerFeeRate: 1, makerFeeRate: 2 });
        const order = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 20 });
        const currentPrice = 10 as Price;

        const result = calculateFee(strategy, order, currentPrice);

        expect(result).toEqual({ amount: 4, currency: strategy.baseCurrency });
      });
    });
  });
  describe('[GIVEN] the order is an exit LIMIT order [AND] the limit price is less than or equal to the current price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount that calculate from taker fee rate, and asset currency', () => {
        const strategy = mockStrategyModule({ takerFeeRate: 1, makerFeeRate: 2 });
        const order = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 20 });
        const currentPrice = 30 as Price;

        const result = calculateFee(strategy, order, currentPrice);

        expect(result).toEqual({ amount: 3, currency: strategy.baseCurrency });
      });
    });
  });

  describe('[GIVEN] the order is an entry STOP_MARKET order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount that calculate from taker fee rate, and asset currency', () => {
        const strategy = mockStrategyModule({ takerFeeRate: 5 });
        const order = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 20 });
        const currentPrice = 10 as Price;

        const result = calculateFee(strategy, order, currentPrice);

        expect(result).toEqual({ amount: 0.5, currency: strategy.assetCurrency });
      });
    });
  });
  describe('[GIVEN] the order is an exit STOP_MARKET order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount that calculate from taker fee rate, and asset currency', () => {
        const strategy = mockStrategyModule({ takerFeeRate: 5 });
        const order = mockOpeningStopMarketOrder({ orderSide: 'EXIT', quantity: 10, stopPrice: 20 });
        const currentPrice = 10 as Price;

        const result = calculateFee(strategy, order, currentPrice);

        expect(result).toEqual({ amount: 10, currency: strategy.baseCurrency });
      });
    });
  });

  describe('[GIVEN] the order is an entry STOP_LIMIT order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount that calculate from maker fee rate, and asset currency', () => {
        const strategy = mockStrategyModule({ makerFeeRate: 2 });
        const order = mockOpeningStopLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 20 });
        const currentPrice = 10 as Price;

        const result = calculateFee(strategy, order, currentPrice);

        expect(result).toEqual({ amount: 0.2, currency: strategy.assetCurrency });
      });
    });
  });
  describe('[GIVEN] the order is an exit STOP_LIMIT order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount that calculate from maker fee rate, and asset currency', () => {
        const strategy = mockStrategyModule({ makerFeeRate: 2 });
        const order = mockOpeningStopLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 20 });
        const currentPrice = 10 as Price;

        const result = calculateFee(strategy, order, currentPrice);

        expect(result).toEqual({ amount: 4, currency: strategy.baseCurrency });
      });
    });
  });
});

describe('UUT: Create opening order', () => {
  describe('[WHEN] create opening order', () => {
    it('[THEN] it will return a opening order', () => {
      const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10 });
      const currentDate = randomDate();

      const result = createOpeningOrder(order, currentDate);

      expect(result).toEqual({ ...order, status: 'OPENING', submittedAt: currentDate });
    });
  });
});

describe('UUT: Create filled order', () => {
  describe('[WHEN] create filled order', () => {
    it('[THEN] it will return a filled order', () => {
      const strategy = mockStrategyModule({ takerFeeRate: 5 });
      const order = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });
      const currentDate = randomDate();
      const currentPrice = 10 as Price;

      const result = createFilledOrder(strategy, order, currentDate, currentPrice);

      expect(result).toEqual({
        ...order,
        status: 'FILLED',
        filledPrice: currentPrice,
        fee: { amount: 0.5, currency: strategy.assetCurrency },
        submittedAt: currentDate,
        filledAt: currentDate,
      });
    });
  });
});

describe('UUT: Create rejected order', () => {
  describe('[WHEN] create rejected order', () => {
    it('[THEN] it will return a rejected order', () => {
      const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10 });
      const reason = randomString();
      const currentDate = randomDate();

      const result = createRejectedOrder(order, reason, currentDate);

      expect(result).toEqual({ ...order, status: 'REJECTED', reason, submittedAt: currentDate });
    });
  });
});
