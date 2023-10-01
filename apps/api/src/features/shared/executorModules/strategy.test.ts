import { omit } from 'ramda';

import { mockBtStrategy } from '#test-utils/features/btStrategies/models.js';
import {
  mockCanceledLimitOrder,
  mockCanceledStopLimitOrder,
  mockCanceledStopMarketOrder,
  mockFilledMarketOrder,
  mockOpeningLimitOrder,
  mockOpeningStopLimitOrder,
  mockOpeningStopMarketOrder,
} from '#test-utils/features/shared/order.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategy.js';
import { mockSymbol } from '#test-utils/features/symbols/models.js';

import { FilledOrder } from './orders.js';
import {
  StrategyModule,
  initiateStrategyModule,
  updateStrategyModuleWithCanceledOrder,
  updateStrategyWithFilledOrder,
  updateStrategyWithOpeningOrder,
} from './strategy.js';

describe('UUT: Initiate strategy module', () => {
  describe('[WHEN] initiate strategy module', () => {
    it('[THEN] it will return a strategy module', () => {
      const symbol = mockSymbol();
      const btStrategy = mockBtStrategy({ symbol: symbol.name, currency: symbol.quoteAsset });

      const result = initiateStrategyModule(btStrategy, symbol);

      expect(result).toEqual({
        name: btStrategy.name,
        exchange: btStrategy.exchange,
        symbol,
        timeframe: btStrategy.timeframe,
        takerFeeRate: btStrategy.takerFeeRate,
        makerFeeRate: btStrategy.makerFeeRate,
        maxNumKlines: btStrategy.maxNumKlines,
        initialCapital: btStrategy.initialCapital,
        totalCapital: btStrategy.initialCapital,
        inOrdersCapital: 0,
        availableCapital: btStrategy.initialCapital,
        baseCurrency: symbol.quoteAsset,
        totalAssetQuantity: 0,
        inOrdersAssetQuantity: 0,
        availableAssetQuantity: 0,
        assetCurrency: symbol.baseAsset,
        netReturn: 0,
        grossProfit: 0,
        openReturn: 0,
        grossLoss: 0,
        equity: 0,
        maxDrawdown: 0,
        maxRunup: 0,
        totalFees: { inBaseCurrency: 0, inAssetCurrency: 0 },
      });
    });
  });
});

describe('UUT: Update strategy with filled order', () => {
  function validSetup() {
    const strategy = mockStrategyModule({
      totalCapital: 130,
      inOrdersCapital: 10,
      availableCapital: 100,
      totalAssetQuantity: 100,
      inOrdersAssetQuantity: 50,
      availableAssetQuantity: 50,
      totalFees: { inBaseCurrency: 1, inAssetCurrency: 1 },
    });
    const order = mockFilledMarketOrder({ quantity: 10, filledPrice: 5 } as const);

    return { strategy, order };
  }

  describe('[GIVEN] the order is an entry order [AND] the strategy has enough available capital', () => {
    function setup() {
      const { strategy, order } = validSetup();

      return {
        strategy,
        order: {
          ...order,
          orderSide: 'ENTRY',
          fee: { amount: 2, currency: strategy.assetCurrency },
        } as FilledOrder,
      };
    }

    describe('[WHEN] update strategy with a filled order', () => {
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toSubsetEqualRight({ availableCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 108 });
      });
      it('[THEN] it will return Right of strategy with updated available asset quantity', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 58 });
      });
      it('[THEN] it will return Right of strategy with updated total fee', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toSubsetEqualRight({ totalFees: { inBaseCurrency: 1, inAssetCurrency: 3 } });
      });
    });
  });

  describe('[GIVEN] the order is an entry order [BUT] the strategy does not has enough available capital', () => {
    function setup() {
      const { strategy, order } = validSetup();

      return {
        strategy: {
          ...strategy,
          totalCapital: 60,
          inOrdersCapital: 10,
          availableCapital: 30,
        } as StrategyModule,
        order: {
          ...order,
          orderSide: 'ENTRY',
          fee: { amount: 2, currency: strategy.assetCurrency },
        } as FilledOrder,
      };
    }

    describe('[WHEN] update strategy with a filled order', () => {
      it('[THEN] it will return Left of string', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an exit order [AND] the strategy has enough available asset quantity', () => {
    function setup() {
      const { strategy, order } = validSetup();

      return {
        strategy,
        order: {
          ...order,
          orderSide: 'EXIT',
          fee: { amount: 2, currency: strategy.baseCurrency },
        } as FilledOrder,
      };
    }

    describe('[WHEN] update strategy with a filled order', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toSubsetEqualRight({ totalCapital: 178 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toSubsetEqualRight({ availableCapital: 148 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 90 });
      });
      it('[THEN] it will return Right of strategy with updated available asset quantity', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 40 });
      });
      it('[THEN] it will return Right of strategy with updated total fee', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toSubsetEqualRight({ totalFees: { inBaseCurrency: 3, inAssetCurrency: 1 } });
      });
    });
  });

  describe('[GIVEN] the order is an entry order [BUT] the strategy does not has enough available asset quantity', () => {
    function setup() {
      const { strategy, order } = validSetup();

      return {
        strategy: { ...strategy, availableAssetQuantity: 5 } as StrategyModule,
        order: {
          ...order,
          orderSide: 'EXIT',
          fee: { amount: 2, currency: strategy.baseCurrency },
        } as FilledOrder,
      };
    }

    describe('[WHEN] update strategy with a filled order', () => {
      it('[THEN] it will return Left of string', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithFilledOrder(strategy, order);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Update strategy with opening order', () => {
  function validSetup() {
    const strategy = mockStrategyModule({
      totalCapital: 130,
      inOrdersCapital: 10,
      availableCapital: 100,
      totalAssetQuantity: 100,
      inOrdersAssetQuantity: 50,
      availableAssetQuantity: 50,
      totalFees: { inBaseCurrency: 1, inAssetCurrency: 1 },
    });

    return { strategy };
  }

  describe('[GIVEN] the order is an entry opening LIMIT order', () => {
    function setup() {
      const { strategy } = validSetup();
      const order = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 4 });

      return { strategy, order };
    }

    describe('[WHEN] update strategy with a opening order', () => {
      it('[THEN] it will return Right of updated strategy with updated in-orders capital', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 50 });
      });
      it('[THEN] it will return Right of updated strategy with updated available capital', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toSubsetEqualRight({ availableCapital: 60 });
      });
    });
  });
  describe('[GIVEN] the order is an entry opening LIMIT order [BUT] the strategy does not has enough available capital', () => {
    function setup() {
      const { strategy } = validSetup();
      const order = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 2 });

      return { strategy: { ...strategy, availableCapital: 10 } as StrategyModule, order };
    }

    describe('[WHEN] update strategy with a opening order', () => {
      it('[THEN] it will return Left of string', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an entry opening STOP_MARKET order', () => {
    function setup() {
      const { strategy } = validSetup();
      const order = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 3 });

      return { strategy, order };
    }

    describe('[WHEN] update strategy with a opening order', () => {
      it('[THEN] it will return Right of updated strategy with updated in-orders capital', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 40 });
      });
      it('[THEN] it will return Right of updated strategy with updated available capital', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toSubsetEqualRight({ availableCapital: 70 });
      });
    });
  });
  describe('[GIVEN] the order is an entry opening STOP_MARKET order [BUT] the strategy does not has enough available capital', () => {
    function setup() {
      const { strategy } = validSetup();
      const order = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 2 });

      return { strategy: { ...strategy, availableCapital: 10 } as StrategyModule, order };
    }

    describe('[WHEN] update strategy with a opening order', () => {
      it('[THEN] it will return Left of string', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an entry opening STOP_LIMIT order', () => {
    function setup() {
      const { strategy } = validSetup();
      const order = mockOpeningStopLimitOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        stopPrice: 3,
        limitPrice: 2,
      });

      return { strategy, order };
    }

    describe('[WHEN] update strategy with a opening order', () => {
      it('[THEN] it will return Right of updated strategy with updated in-orders capital', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 30 });
      });
      it('[THEN] it will return Right of updated strategy with updated available capital', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toSubsetEqualRight({ availableCapital: 80 });
      });
    });
  });
  describe('[GIVEN] the order is an entry opening STOP_LIMIT order [BUT] the strategy does not has enough available capital', () => {
    function setup() {
      const { strategy } = validSetup();
      const order = mockOpeningStopLimitOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        stopPrice: 3,
        limitPrice: 2,
      });

      return { strategy: { ...strategy, availableCapital: 10 } as StrategyModule, order };
    }

    describe('[WHEN] update strategy with a opening order', () => {
      it('[THEN] it will return Left of string', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an exit opening order', () => {
    function setup() {
      const { strategy } = validSetup();
      const order = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 4 });

      return { strategy, order };
    }

    describe('[WHEN] update strategy with a opening order', () => {
      it('[THEN] it will return Right of updated strategy with updated in-orders asset quantity', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toSubsetEqualRight({ inOrdersAssetQuantity: 60 });
      });
      it('[THEN] it will return Right of updated strategy with updated available asset quantity', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 40 });
      });
    });
  });

  describe('[GIVEN] the order is an entry opening order [BUT] the strategy does not has enough available capital', () => {
    function setup() {
      const { strategy } = validSetup();
      const order = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 2 });

      return { strategy: { ...strategy, availableCapital: 10 } as StrategyModule, order };
    }

    describe('[WHEN] update strategy with a opening order', () => {
      it('[THEN] it will return Left of string', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an exit opening order [BUT] the strategy does not has enough available asset quantity', () => {
    function setup() {
      const { strategy } = validSetup();
      const order = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 4 });

      return { strategy: { ...strategy, availableAssetQuantity: 8 } as StrategyModule, order };
    }

    describe('[WHEN] update strategy with a opening order', () => {
      it('[THEN] it will return Left of string', () => {
        const { strategy, order } = setup();

        const result = updateStrategyWithOpeningOrder(strategy, order);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Update strategy module with canceled order', () => {
  describe('[GIVEN] the canceled order is an entry LIMIT order', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 100, availableCapital: 100 });
    const canceledOrder = mockCanceledLimitOrder({ orderSide: 'ENTRY', quantity: 5, limitPrice: 10 });

    describe('[WHEN] update strategy module with the canceled order', () => {
      it('[THEN] it will return strategy module with in-orders capital property equals to the current value - (order quantity * limit price)', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersCapital', 50);
      });
      it('[THEN] it will return strategy module with available capital property equals to the current value + (order quantity * limit price)', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableCapital', 150);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        const unchangedParts = omit(['inOrdersCapital', 'availableCapital'], strategyModule);
        expect(result).toEqual(expect.objectContaining(unchangedParts));
      });
    });
  });

  describe('[GIVEN] the canceled order is an entry STOP_MARKET order', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 100, availableCapital: 100 });
    const canceledOrder = mockCanceledStopMarketOrder({ orderSide: 'ENTRY', quantity: 5, stopPrice: 10 });

    describe('[WHEN] update strategy module with the canceled order', () => {
      it('[THEN] it will return strategy module with in-orders capital property equals to the current value - (order quantity * stop price)', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersCapital', 50);
      });
      it('[THEN] it will return strategy module with available capital property equals to the current value + (order quantity * stop price)', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableCapital', 150);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        const unchangedParts = omit(['inOrdersCapital', 'availableCapital'], strategyModule);
        expect(result).toEqual(expect.objectContaining(unchangedParts));
      });
    });
  });

  describe('[GIVEN] the canceled order is an entry STOP_LIMIT order', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 100, availableCapital: 100 });
    const canceledOrder = mockCanceledStopLimitOrder({ orderSide: 'ENTRY', quantity: 5, limitPrice: 10 });

    describe('[WHEN] update strategy module with the canceled order', () => {
      it('[THEN] it will return strategy module with in-orders capital property equals to the current value - (order quantity * limit price)', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersCapital', 50);
      });
      it('[THEN] it will return strategy module with available capital property equals to the current value + (order quantity * limit price)', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableCapital', 150);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        const unchangedParts = omit(['inOrdersCapital', 'availableCapital'], strategyModule);
        expect(result).toEqual(expect.objectContaining(unchangedParts));
      });
    });
  });

  describe('[GIVEN] the canceled order is an exit order', () => {
    const strategyModule = mockStrategyModule({ inOrdersAssetQuantity: 20, availableAssetQuantity: 30 });
    const canceledOrder = mockCanceledLimitOrder({ orderSide: 'EXIT', quantity: 5 });

    describe('[WHEN] update strategy module with the canceled order', () => {
      it('[THEN] it will return strategy module with in-orders asset quantity equals to the current value - order quantity', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersAssetQuantity', 15);
      });
      it('[THEN] it will return strategy module with available asset quantity equals to the current value + order quantity', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableAssetQuantity', 35);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWithCanceledOrder(strategyModule, canceledOrder);

        const unchangedParts = omit(['inOrdersAssetQuantity', 'availableAssetQuantity'], strategyModule);
        expect(result).toEqual(expect.objectContaining(unchangedParts));
      });
    });
  });
});
