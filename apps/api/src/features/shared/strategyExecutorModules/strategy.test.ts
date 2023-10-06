import { omit } from 'ramda';

import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import {
  mockCanceledLimitOrder,
  mockCanceledStopLimitOrder,
  mockCanceledStopMarketOrder,
  mockFilledLimitOrder,
  mockFilledMarketOrder,
  mockFilledStopLimitOrder,
  mockFilledStopMarketOrder,
  mockOpeningLimitOrder,
  mockOpeningStopLimitOrder,
  mockOpeningStopMarketOrder,
} from '#test-utils/features/shared/order.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategyModule.js';

import { exchangeNameEnum } from '../exchange.js';
import {
  AssetCurrency,
  CapitalCurrency,
  InitialCapital,
  MakerFeeRate,
  StrategyName,
  TakerFeeRate,
} from '../strategy.js';
import { timeframeEnum } from '../timeframe.js';
import {
  initiateStrategyModule,
  transformStrategyModuleWhenOpeningOrderTransitToFilled,
  transformStrategyModuleWhenOrderTransitToCanceled,
  transformStrategyModuleWhenPendingOrderTransitToFilled,
  transformStrategyModuleWhenPendingOrderTransitToOpening,
} from './strategy.js';

describe('UUT: Initiate strategy module', () => {
  describe('[WHEN] initiate strategy module', () => {
    it('[THEN] it will return a strategy module', () => {
      const symbol = mockBnbSymbol();
      const request = {
        name: 'test' as StrategyName,
        exchange: exchangeNameEnum.BINANCE,
        timeframe: timeframeEnum['1d'],
        takerFeeRate: 1 as TakerFeeRate,
        makerFeeRate: 2 as MakerFeeRate,
        initialCapital: 1000 as InitialCapital,
        capitalCurrency: symbol.quoteAsset as CapitalCurrency,
        assetCurrency: symbol.baseAsset as AssetCurrency,
      };

      const result = initiateStrategyModule(request, symbol);

      expect(result).toEqual({
        ...request,
        symbol,
        totalCapital: request.initialCapital,
        inOrdersCapital: 0,
        availableCapital: request.initialCapital,
        totalAssetQuantity: 0,
        inOrdersAssetQuantity: 0,
        availableAssetQuantity: 0,
        openReturn: 0,
        netReturn: 0,
        netProfit: 0,
        netLoss: 0,
        equity: 0,
        maxDrawdown: 0,
        maxRunup: 0,
        totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0 },
      });
    });
  });
});

describe('UUT: Transform strategy module when pending order transit to filled', () => {
  describe('[GIVEN] the order is an entry order [AND] the strategy has enough available capital', () => {
    const strategyModule = mockStrategyModule({
      totalCapital: 120,
      availableCapital: 100,
      totalAssetQuantity: 100,
      availableAssetQuantity: 50,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const filledOrder = mockFilledMarketOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      filledPrice: 5,
      fee: { amount: 2, currency: strategyModule.assetCurrency },
    });

    describe('[WHEN] update strategy module when pending order transit to filled', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 70 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 108 });
      });
      it('[THEN] it will return Right of strategy with updated available asset quantity', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 58 });
      });
      it('[THEN] it will return Right of strategy with updated total fee', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 1, inAssetCurrency: 3 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        const unchangedParts = omit(
          ['totalCapital', 'availableCapital', 'totalAssetQuantity', 'availableAssetQuantity', 'totalFees'],
          strategyModule,
        );
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an entry order [BUT] the strategy does not have enough available capital', () => {
    const strategy = mockStrategyModule({ availableCapital: 30 });
    const filledOrder = mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 10, filledPrice: 5 });

    describe('[WHEN] update strategy module when pending order transit to filled', () => {
      it('[THEN] it will return Left of string', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategy, filledOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an exit order [AND] the strategy has enough available asset quantity', () => {
    const strategyModule = mockStrategyModule({
      totalCapital: 120,
      availableCapital: 100,
      totalAssetQuantity: 100,
      availableAssetQuantity: 50,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const filledOrder = mockFilledMarketOrder({
      orderSide: 'EXIT',
      quantity: 10,
      filledPrice: 5,
      fee: { amount: 3, currency: strategyModule.capitalCurrency },
    });

    describe('[WHEN] transform strategy module when pending order transit to filled', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 167 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 147 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 90 });
      });
      it('[THEN] it will return Right of strategy with updated available asset quantity', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 40 });
      });
      it('[THEN] it will return Right of strategy with updated total fee', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 4, inAssetCurrency: 1 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategyModule, filledOrder);

        const unchangedParts = omit(
          ['totalCapital', 'availableCapital', 'totalAssetQuantity', 'availableAssetQuantity', 'totalFees'],
          strategyModule,
        );
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an exit order [BUT] the strategy does not have enough available asset quantity', () => {
    const strategy = mockStrategyModule({ availableAssetQuantity: 30 });
    const filledOrder = mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 50 });

    describe('[WHEN] transform strategy module when pending order transit to filled', () => {
      it('[THEN] it will return Left of string', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToFilled(strategy, filledOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Transform strategy module when pending order transit to opening', () => {
  describe('[GIVEN] the order is an entry LIMIT order [AND] the strategy has enough available capital', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 10, availableCapital: 100 });
    const openingOrder = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });

    describe('[WHEN] update strategy module when pending order transit to opening', () => {
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 60 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        const unchangedParts = omit(['inOrdersCapital', 'availableCapital'], strategyModule);
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an entry LIMIT order [BUT] the strategy does not have enough available capital', () => {
    const strategy = mockStrategyModule({ availableCapital: 30 });
    const openingOrder = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });

    describe('[WHEN] update strategy module when pending order transit to opening', () => {
      it('[THEN] it will return Left of string', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategy, openingOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an entry STOP_MARKET order [AND] the strategy has enough available capital', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 10, availableCapital: 100 });
    const openingOrder = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 5 });

    describe('[WHEN] update strategy module when pending order transit to opening', () => {
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 60 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        const unchangedParts = omit(['inOrdersCapital', 'availableCapital'], strategyModule);
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an entry STOP_MARKET order [BUT] the strategy does not have enough available capital', () => {
    const strategy = mockStrategyModule({ availableCapital: 30 });
    const openingOrder = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 5 });

    describe('[WHEN] update strategy module when pending order transit to opening', () => {
      it('[THEN] it will return Left of string', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategy, openingOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an entry STOP_LIMIT order [AND] the strategy has enough available capital', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 10, availableCapital: 100 });
    const openingOrder = mockOpeningStopLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });

    describe('[WHEN] update strategy module when pending order transit to opening', () => {
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 60 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        const unchangedParts = omit(['inOrdersCapital', 'availableCapital'], strategyModule);
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an entry STOP_LIMIT order [BUT] the strategy does not have enough available capital', () => {
    const strategy = mockStrategyModule({ availableCapital: 30 });
    const openingOrder = mockOpeningStopLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });

    describe('[WHEN] update strategy module when pending order transit to opening', () => {
      it('[THEN] it will return Left of string', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategy, openingOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an exit order [AND] the strategy has enough available asset quantity', () => {
    const strategyModule = mockStrategyModule({ inOrdersAssetQuantity: 5, availableAssetQuantity: 50 });
    const openingOrder = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 10 });

    describe('[WHEN] transform strategy module when pending order transit to opening', () => {
      it('[THEN] it will return Right of strategy with updated in-orders asset quantity', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ inOrdersAssetQuantity: 15 });
      });
      it('[THEN] it will return Right of strategy with updated available asset quantity', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 40 });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategyModule, openingOrder);

        const unchangedParts = omit(['inOrdersAssetQuantity', 'availableAssetQuantity'], strategyModule);
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an exit order [BUT] the strategy does not have enough available asset quantity', () => {
    const strategy = mockStrategyModule({ availableAssetQuantity: 30 });
    const openingOrder = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 50 });

    describe('[WHEN] transform strategy module when pending order transit to opening', () => {
      it('[THEN] it will return Left of string', () => {
        const result = transformStrategyModuleWhenPendingOrderTransitToOpening(strategy, openingOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Transform strategy module when opening order transit to filled', () => {
  describe('[GIVEN] the order is an entry LIMIT order [AND] the strategy has enough in-orders capital', () => {
    const strategyModule = mockStrategyModule({
      totalCapital: 1000,
      inOrdersCapital: 100,
      availableCapital: 10,
      totalAssetQuantity: 10,
      availableAssetQuantity: 5,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const filledOrder = mockFilledLimitOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      limitPrice: 5,
      filledPrice: 4,
      fee: { amount: 1, currency: strategyModule.assetCurrency },
    });

    describe('[WHEN] update strategy module when opening order transit to filled', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 960 });
      });
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 20 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 19 });
      });
      it('[THEN] it will return Right of strategy with updated available quantity', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 14 });
      });
      it('[THEN] it will return Right of strategy with updated total fees', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 1, inAssetCurrency: 2 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        const unchangedParts = omit(
          [
            'totalCapital',
            'inOrdersCapital',
            'availableCapital',
            'totalAssetQuantity',
            'availableAssetQuantity',
            'totalFees',
          ],
          strategyModule,
        );
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an entry LIMIT order [BUT] the strategy does not have enough in-orders capital', () => {
    const strategy = mockStrategyModule({ inOrdersCapital: 30 });
    const filledOrder = mockFilledLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });

    describe('[WHEN] update strategy module when opening order transit to filled', () => {
      it('[THEN] it will return Left of string', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategy, filledOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an entry STOP_MARKET order [AND] the strategy has enough in-orders capital', () => {
    const strategyModule = mockStrategyModule({
      totalCapital: 1000,
      inOrdersCapital: 100,
      availableCapital: 10,
      totalAssetQuantity: 10,
      availableAssetQuantity: 5,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const filledOrder = mockFilledStopMarketOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      stopPrice: 5,
      filledPrice: 4,
      fee: { amount: 1, currency: strategyModule.assetCurrency },
    });

    describe('[WHEN] update strategy module when opening order transit to filled', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 960 });
      });
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 20 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 19 });
      });
      it('[THEN] it will return Right of strategy with updated available quantity', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 14 });
      });
      it('[THEN] it will return Right of strategy with updated total fees', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 1, inAssetCurrency: 2 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        const unchangedParts = omit(
          [
            'totalCapital',
            'inOrdersCapital',
            'availableCapital',
            'totalAssetQuantity',
            'availableAssetQuantity',
            'totalFees',
          ],
          strategyModule,
        );
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an entry STOP_MARKET order [BUT] the strategy does not have enough in-orders capital', () => {
    const strategy = mockStrategyModule({ inOrdersCapital: 30 });
    const filledOrder = mockFilledStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 5 });

    describe('[WHEN] update strategy module when opening order transit to filled', () => {
      it('[THEN] it will return Left of string', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategy, filledOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an entry STOP_LIMIT order [AND] the strategy has enough in-orders capital', () => {
    const strategyModule = mockStrategyModule({
      totalCapital: 1000,
      inOrdersCapital: 100,
      availableCapital: 10,
      totalAssetQuantity: 10,
      availableAssetQuantity: 5,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const filledOrder = mockFilledStopLimitOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      limitPrice: 5,
      filledPrice: 4,
      fee: { amount: 1, currency: strategyModule.assetCurrency },
    });

    describe('[WHEN] update strategy module when opening order transit to filled', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 960 });
      });
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 20 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 19 });
      });
      it('[THEN] it will return Right of strategy with updated available quantity', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 14 });
      });
      it('[THEN] it will return Right of strategy with updated total fees', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 1, inAssetCurrency: 2 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        const unchangedParts = omit(
          [
            'totalCapital',
            'inOrdersCapital',
            'availableCapital',
            'totalAssetQuantity',
            'availableAssetQuantity',
            'totalFees',
          ],
          strategyModule,
        );
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an entry STOP_LIMIT order [BUT] the strategy does not have enough in-orders capital', () => {
    const strategy = mockStrategyModule({ inOrdersCapital: 30 });
    const filledOrder = mockFilledStopLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });

    describe('[WHEN] update strategy module when opening order transit to filled', () => {
      it('[THEN] it will return Left of string', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategy, filledOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an exit order [AND] the strategy has enough available asset quantity', () => {
    const strategyModule = mockStrategyModule({
      totalCapital: 1000,
      availableCapital: 10,
      totalAssetQuantity: 70,
      inOrdersAssetQuantity: 20,
      totalFees: { inCapitalCurrency: 1, inAssetCurrency: 1 },
    });
    const filledOrder = mockFilledLimitOrder({
      orderSide: 'EXIT',
      quantity: 10,
      filledPrice: 1,
      fee: { amount: 2, currency: strategyModule.capitalCurrency },
    });

    describe('[WHEN] transform strategy module when pending order transit to opening', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 1008 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 18 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 60 });
      });
      it('[THEN] it will return Right of strategy with updated in-orders asset quantity', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ inOrdersAssetQuantity: 10 });
      });
      it('[THEN] it will return Right of strategy with updated total fees', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 3, inAssetCurrency: 1 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategyModule, filledOrder);

        const unchangedParts = omit(
          ['totalCapital', 'availableCapital', 'totalAssetQuantity', 'inOrdersAssetQuantity', 'totalFees'],
          strategyModule,
        );
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an exit order [BUT] the strategy does not have enough available asset quantity', () => {
    const strategy = mockStrategyModule({ availableAssetQuantity: 30 });
    const filledOrder = mockFilledLimitOrder({ orderSide: 'EXIT', quantity: 50 });

    describe('[WHEN] transform strategy module when pending order transit to opening', () => {
      it('[THEN] it will return Left of string', () => {
        const result = transformStrategyModuleWhenOpeningOrderTransitToFilled(strategy, filledOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Transform strategy module when order transit to canceled', () => {
  describe('[GIVEN] the canceled order is an entry LIMIT order', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 100, availableCapital: 100 });
    const canceledOrder = mockCanceledLimitOrder({ orderSide: 'ENTRY', quantity: 5, limitPrice: 10 });

    describe('[WHEN] update strategy module with the canceled order', () => {
      it('[THEN] it will return strategy module with in-orders capital property equals to the current value - (order quantity * limit price)', () => {
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersCapital', 50);
      });
      it('[THEN] it will return strategy module with available capital property equals to the current value + (order quantity * limit price)', () => {
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableCapital', 150);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

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
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersCapital', 50);
      });
      it('[THEN] it will return strategy module with available capital property equals to the current value + (order quantity * stop price)', () => {
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableCapital', 150);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

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
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersCapital', 50);
      });
      it('[THEN] it will return strategy module with available capital property equals to the current value + (order quantity * limit price)', () => {
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableCapital', 150);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

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
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersAssetQuantity', 15);
      });
      it('[THEN] it will return strategy module with available asset quantity equals to the current value + order quantity', () => {
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableAssetQuantity', 35);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = transformStrategyModuleWhenOrderTransitToCanceled(strategyModule, canceledOrder);

        const unchangedParts = omit(['inOrdersAssetQuantity', 'availableAssetQuantity'], strategyModule);
        expect(result).toEqual(expect.objectContaining(unchangedParts));
      });
    });
  });
});
