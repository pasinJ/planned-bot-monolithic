import { faker } from '@faker-js/faker';
import { utcToZonedTime } from 'date-fns-tz';
import { ReadonlyNonEmptyArray, last } from 'fp-ts/lib/ReadonlyNonEmptyArray.js';
import { ascend, mergeDeepRight, prop, sort } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { KlineModel } from '#features/btStrategies/dataModels/kline.js';
import { randomDate } from '#test-utils/faker/date.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { randomPositiveFloat } from '#test-utils/faker/number.js';
import { mockBtStrategy, mockKline } from '#test-utils/features/btStrategies/models.js';

import { OpeningOrder, OrderId, OrdersModuleDeps, buildOrdersModule } from './orders.js';

function mockDeps(overrides?: DeepPartial<OrdersModuleDeps>): OrdersModuleDeps {
  return mergeDeepRight(
    {
      generateOrderId: () => randomOrderId(),
      dateService: { getCurrentDate: () => lastKline.closeTimestamp },
    },
    overrides ?? {},
  );
}
function randomOrderId() {
  return faker.string.nanoid() as OrderId;
}
function mockOpeningOrder(orderId: OrderId, isEntry = true): OpeningOrder {
  return {
    id: orderId,
    symbol: lastKline.symbol,
    isEntry,
    currency: strategy.currency,
    createdAt: randomDate(),
    status: 'OPENING',
    submittedAt: randomDate(),
    type: 'LIMIT',
    quantity: randomPositiveFloat(),
    limitPrice: randomPositiveFloat(),
  };
}

const strategy = mockBtStrategy();
const unorderedKlines = generateArrayOf(() => mockKline({ symbol: strategy.symbol }), 5);
const klines = sort(
  ascend(prop('closeTimestamp')),
  unorderedKlines,
) as unknown as ReadonlyNonEmptyArray<KlineModel>;
const lastKline = last(klines);

describe('UUT: Orders module', () => {
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
            isEntry: true,
            currency: strategy.currency,
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'MARKET',
            quantity,
            status: 'PENDING',
          });
        });
      });
    });

    describe('[WHEN] enter a trade position with market order using quote quantity property', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.enterMarket({ quoteQuantity: randomPositiveFloat() });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user called enter trade position with market order using quote quantity property', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the entered market order', () => {
          const orderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => orderId });
          const ordersModule = buildOrdersModule(deps, strategy, []);
          const quoteQuantity = randomPositiveFloat();
          ordersModule.enterMarket({ quoteQuantity });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            symbol: strategy.symbol,
            isEntry: true,
            currency: strategy.currency,
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'MARKET',
            quoteQuantity,
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
            isEntry: true,
            currency: strategy.currency,
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
            isEntry: true,
            currency: strategy.currency,
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
            isEntry: true,
            currency: strategy.currency,
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
            isEntry: false,
            currency: strategy.currency,
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'MARKET',
            quantity,
            status: 'PENDING',
          });
        });
      });
    });

    describe('[WHEN] exit a trade position with market order using quote quantity property', () => {
      it('[THEN] it will return void', () => {
        const ordersModule = buildOrdersModule(mockDeps(), strategy, []);

        const result = ordersModule.exitMarket({ quoteQuantity: randomPositiveFloat() });

        expect(result).toBeUndefined();
      });
    });
    describe('[GIVEN] user called exit trade position with market order using quote quantity property', () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array that contains the exited market order', () => {
          const orderId = randomOrderId();
          const deps = mockDeps({ generateOrderId: () => orderId });
          const ordersModule = buildOrdersModule(deps, strategy, []);
          const quoteQuantity = randomPositiveFloat();
          ordersModule.exitMarket({ quoteQuantity });

          const result = ordersModule.getPendingOrders();

          expect(result).toContainEqual({
            id: orderId,
            symbol: strategy.symbol,
            isEntry: false,
            currency: strategy.currency,
            createdAt: utcToZonedTime(lastKline.closeTimestamp, strategy.timezone),
            type: 'MARKET',
            quoteQuantity,
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
            isEntry: false,
            currency: strategy.currency,
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
            isEntry: false,
            currency: strategy.currency,
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
            isEntry: false,
            currency: strategy.currency,
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
          const ordersModule = buildOrdersModule(deps, strategy, [mockOpeningOrder(openingOrderId)]);
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
          const ordersModule = buildOrdersModule(deps, strategy, [mockOpeningOrder(openingOrderId)]);
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
        mockOpeningOrder(openingOrderId, true),
        mockOpeningOrder(openingEntryOrderId, true),
        mockOpeningOrder(openingExitOrderId, false),
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
          ordersModule.cancelAllOrders({ side: ['ENTRY'], status: 'PENDING' });

          const result = ordersModule.getPendingOrders();

          expect(result).not.toPartiallyContain({ isEntry: true });
          expect(result).toIncludeAllPartialMembers([{ isEntry: false }, { type: 'CANCEL' }]);
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using side = ['EXIT'] and status = 'PENDING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with only entry and cancel orders', () => {
          const { ordersModule } = setupOrders();
          ordersModule.cancelAllOrders({ side: ['EXIT'], status: 'PENDING' });

          const result = ordersModule.getPendingOrders();

          expect(result).not.toPartiallyContain({ isEntry: false });
          expect(result).toIncludeAllPartialMembers([{ isEntry: true }, { type: 'CANCEL' }]);
        });
      });
    });
    describe("[GIVEN] there were pending entry, exit, and cancel orders [AND] user canceled all orders using side = ['CANCEL'] and status = 'PENDING'", () => {
      describe('[WHEN] get pending orders', () => {
        it('[THEN] it will return an array with only entry and exit orders', () => {
          const { ordersModule } = setupOrders();
          ordersModule.cancelAllOrders({ side: ['CANCEL'], status: 'PENDING' });

          const result = ordersModule.getPendingOrders();

          expect(result).not.toPartiallyContain({ type: 'CANCEL' });
          expect(result).toIncludeAllPartialMembers([{ isEntry: true }, { isEntry: false }]);
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
          ordersModule.cancelAllOrders({ side: ['ENTRY'], status: 'OPENING' });

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
          ordersModule.cancelAllOrders({ side: ['EXIT'], status: 'OPENING' });

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
          ordersModule.cancelAllOrders({ side: ['CANCEL'], status: 'OPENING' });

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
            mockOpeningOrder(randomOrderId(), true),
            mockOpeningOrder(randomOrderId(), false),
          ];
          const ordersModule = buildOrdersModule(mockDeps(), strategy, openingOrders);

          const result = ordersModule.getOpeningOrders();

          expect(result).toEqual(openingOrders);
        });
      });
    });
  });
});
