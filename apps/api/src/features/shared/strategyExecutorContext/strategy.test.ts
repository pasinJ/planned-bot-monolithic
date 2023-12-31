import { dissoc, omit } from 'ramda';

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
import { mockClosedTrade, mockOpeningTrade } from '#test-utils/features/shared/trades.js';

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
import { ClosedTrade, OpeningTrade, UnrealizedReturn } from '../trade.js';
import {
  initiateStrategyModule,
  updateStrategyModuleStats,
  updateStrategyModuleWhenOpeningOrderIsFilled,
  updateStrategyModuleWhenOrderIsCanceled,
  updateStrategyModuleWhenPendingOrderIsFilled,
  updateStrategyModuleWhenPendingOrderIsOpened,
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
        ...dissoc('exchange', request),
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
        equity: request.initialCapital,
        maxDrawdown: 0,
        maxRunup: 0,
        totalFees: { inCapitalCurrency: 0, inAssetCurrency: 0 },
      });
    });
  });
});

describe('UUT: Update strategy module when pending order is filled', () => {
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

    describe('[WHEN] update strategy module when pending order is filled', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 70 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 108 });
      });
      it('[THEN] it will return Right of strategy with updated available asset quantity', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 58 });
      });
      it('[THEN] it will return Right of strategy with updated total fee', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 1, inAssetCurrency: 3 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

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

    describe('[WHEN] update strategy module when pending order is filled', () => {
      it('[THEN] it will return Left of string', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategy, filledOrder);

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

    describe('[WHEN] update strategy module when pending order is filled', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 167 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 147 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 90 });
      });
      it('[THEN] it will return Right of strategy with updated available asset quantity', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 40 });
      });
      it('[THEN] it will return Right of strategy with updated total fee', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 4, inAssetCurrency: 1 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategyModule, filledOrder);

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

    describe('[WHEN] update strategy module when pending order is filled', () => {
      it('[THEN] it will return Left of string', () => {
        const result = updateStrategyModuleWhenPendingOrderIsFilled(strategy, filledOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Update strategy module when pending order is opened', () => {
  describe('[GIVEN] the order is an entry LIMIT order [AND] the strategy has enough available capital', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 10, availableCapital: 100 });
    const openingOrder = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });

    describe('[WHEN] update strategy module when pending order is opened', () => {
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 60 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        const unchangedParts = omit(['inOrdersCapital', 'availableCapital'], strategyModule);
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an entry LIMIT order [BUT] the strategy does not have enough available capital', () => {
    const strategy = mockStrategyModule({ availableCapital: 30 });
    const openingOrder = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });

    describe('[WHEN] update strategy module when pending order is opened', () => {
      it('[THEN] it will return Left of string', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategy, openingOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an entry STOP_MARKET order [AND] the strategy has enough available capital', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 10, availableCapital: 100 });
    const openingOrder = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 5 });

    describe('[WHEN] update strategy module when pending order is opened', () => {
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 60 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        const unchangedParts = omit(['inOrdersCapital', 'availableCapital'], strategyModule);
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an entry STOP_MARKET order [BUT] the strategy does not have enough available capital', () => {
    const strategy = mockStrategyModule({ availableCapital: 30 });
    const openingOrder = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', quantity: 10, stopPrice: 5 });

    describe('[WHEN] update strategy module when pending order is opened', () => {
      it('[THEN] it will return Left of string', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategy, openingOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an entry STOP_LIMIT order [AND] the strategy has enough available capital', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 10, availableCapital: 100 });
    const openingOrder = mockOpeningStopLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });

    describe('[WHEN] update strategy module when pending order is opened', () => {
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 60 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        const unchangedParts = omit(['inOrdersCapital', 'availableCapital'], strategyModule);
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an entry STOP_LIMIT order [BUT] the strategy does not have enough available capital', () => {
    const strategy = mockStrategyModule({ availableCapital: 30 });
    const openingOrder = mockOpeningStopLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });

    describe('[WHEN] update strategy module when pending order is opened', () => {
      it('[THEN] it will return Left of string', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategy, openingOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the order is an exit order [AND] the strategy has enough available asset quantity', () => {
    const strategyModule = mockStrategyModule({ inOrdersAssetQuantity: 5, availableAssetQuantity: 50 });
    const openingOrder = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 10 });

    describe('[WHEN] update strategy module when pending order is opened', () => {
      it('[THEN] it will return Right of strategy with updated in-orders asset quantity', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ inOrdersAssetQuantity: 15 });
      });
      it('[THEN] it will return Right of strategy with updated available asset quantity', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 40 });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategyModule, openingOrder);

        const unchangedParts = omit(['inOrdersAssetQuantity', 'availableAssetQuantity'], strategyModule);
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an exit order [BUT] the strategy does not have enough available asset quantity', () => {
    const strategy = mockStrategyModule({ availableAssetQuantity: 30 });
    const openingOrder = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 50 });

    describe('[WHEN] update strategy module when pending order is opened', () => {
      it('[THEN] it will return Left of string', () => {
        const result = updateStrategyModuleWhenPendingOrderIsOpened(strategy, openingOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Update strategy module when opening order is filled', () => {
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

    describe('[WHEN] update strategy module when opening order is filled', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 960 });
      });
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 20 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 19 });
      });
      it('[THEN] it will return Right of strategy with updated available quantity', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 14 });
      });
      it('[THEN] it will return Right of strategy with updated total fees', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 1, inAssetCurrency: 2 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

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

    describe('[WHEN] update strategy module when opening order is filled', () => {
      it('[THEN] it will return Left of string', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategy, filledOrder);

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

    describe('[WHEN] update strategy module when opening order is filled', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 960 });
      });
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 20 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 19 });
      });
      it('[THEN] it will return Right of strategy with updated available quantity', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 14 });
      });
      it('[THEN] it will return Right of strategy with updated total fees', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 1, inAssetCurrency: 2 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

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

    describe('[WHEN] update strategy module when opening order is filled', () => {
      it('[THEN] it will return Left of string', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategy, filledOrder);

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

    describe('[WHEN] update strategy module when opening order is filled', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 960 });
      });
      it('[THEN] it will return Right of strategy with updated in-orders capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ inOrdersCapital: 50 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 20 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 19 });
      });
      it('[THEN] it will return Right of strategy with updated available quantity', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableAssetQuantity: 14 });
      });
      it('[THEN] it will return Right of strategy with updated total fees', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 1, inAssetCurrency: 2 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

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

    describe('[WHEN] update strategy module when opening order is filled', () => {
      it('[THEN] it will return Left of string', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategy, filledOrder);

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

    describe('[WHEN] update strategy module when pending order is opened', () => {
      it('[THEN] it will return Right of strategy with updated total capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalCapital: 1008 });
      });
      it('[THEN] it will return Right of strategy with updated available capital', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ availableCapital: 18 });
      });
      it('[THEN] it will return Right of strategy with updated total asset quantity', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalAssetQuantity: 60 });
      });
      it('[THEN] it will return Right of strategy with updated in-orders asset quantity', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ inOrdersAssetQuantity: 10 });
      });
      it('[THEN] it will return Right of strategy with updated total fees', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        expect(result).toSubsetEqualRight({ totalFees: { inCapitalCurrency: 3, inAssetCurrency: 1 } });
      });
      it('[THEN] it will return Right of strategy with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategyModule, filledOrder);

        const unchangedParts = omit(
          ['totalCapital', 'availableCapital', 'totalAssetQuantity', 'inOrdersAssetQuantity', 'totalFees'],
          strategyModule,
        );
        expect(result).toSubsetEqualRight(unchangedParts);
      });
    });
  });
  describe('[GIVEN] the order is an exit order [BUT] the strategy does not have enough available in-orders quantity', () => {
    const strategy = mockStrategyModule({ inOrdersAssetQuantity: 30 });
    const filledOrder = mockFilledLimitOrder({ orderSide: 'EXIT', quantity: 50 });

    describe('[WHEN] update strategy module when pending order is opened', () => {
      it('[THEN] it will return Left of string', () => {
        const result = updateStrategyModuleWhenOpeningOrderIsFilled(strategy, filledOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Update strategy module when order is canceled', () => {
  describe('[GIVEN] the canceled order is an entry LIMIT order', () => {
    const strategyModule = mockStrategyModule({ inOrdersCapital: 100, availableCapital: 100 });
    const canceledOrder = mockCanceledLimitOrder({ orderSide: 'ENTRY', quantity: 5, limitPrice: 10 });

    describe('[WHEN] update strategy module with the canceled order', () => {
      it('[THEN] it will return strategy module with in-orders capital property equals to the current value - (order quantity * limit price)', () => {
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersCapital', 50);
      });
      it('[THEN] it will return strategy module with available capital property equals to the current value + (order quantity * limit price)', () => {
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableCapital', 150);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

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
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersCapital', 50);
      });
      it('[THEN] it will return strategy module with available capital property equals to the current value + (order quantity * stop price)', () => {
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableCapital', 150);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

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
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersCapital', 50);
      });
      it('[THEN] it will return strategy module with available capital property equals to the current value + (order quantity * limit price)', () => {
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableCapital', 150);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

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
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('inOrdersAssetQuantity', 15);
      });
      it('[THEN] it will return strategy module with available asset quantity equals to the current value + order quantity', () => {
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

        expect(result).toHaveProperty('availableAssetQuantity', 35);
      });
      it('[THEN] it will return strategy module with the other properties remain unchanged', () => {
        const result = updateStrategyModuleWhenOrderIsCanceled(strategyModule, canceledOrder);

        const unchangedParts = omit(['inOrdersAssetQuantity', 'availableAssetQuantity'], strategyModule);
        expect(result).toEqual(expect.objectContaining(unchangedParts));
      });
    });
  });
});

describe('UUT: Update strategy module stats with trades', () => {
  describe('[GIVEN] there are only opening trades', () => {
    const strategyModule = mockStrategyModule({ initialCapital: 100 });
    const openingTradeBase = mockOpeningTrade(mockFilledMarketOrder({ orderSide: 'ENTRY' }));
    const openingTrade1 = { ...openingTradeBase, unrealizedReturn: 10 as UnrealizedReturn };
    const openingTrade2 = { ...openingTradeBase, unrealizedReturn: 5 as UnrealizedReturn };
    const openingTrades = [openingTrade1, openingTrade2];
    const closedTrades = [] as ClosedTrade[];

    describe('[WHEN] update strategy module stats with trades', () => {
      it('[THEN] it will return strategy module with open return property equals to sum of unrealized return of opening trades', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ openReturn: 15 }));
      });
      it('[THEN] it will return strategy module with net return, net profit, net loss properties equal to 0', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ netReturn: 0, netProfit: 0, netLoss: 0 }));
      });
      it('[THEN] it will return strategy module with equity property equal to initial capital plus open return', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ equity: 115 }));
      });
    });
  });

  describe('[GIVEN] there are only closed trades', () => {
    const strategyModule = mockStrategyModule({ initialCapital: 100 });
    const openingTrades = [] as OpeningTrade[];
    const closedTrade1 = mockClosedTrade(
      mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 10, filledPrice: 5, fee: { amount: 0 } }),
      mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 10, filledPrice: 6, fee: { amount: 0 } }),
    );
    const closedTrade2 = mockClosedTrade(
      mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 10, filledPrice: 10, fee: { amount: 0 } }),
      mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 10, filledPrice: 8, fee: { amount: 0 } }),
    );
    const closedTrades = [closedTrade1, closedTrade2];

    describe('[WHEN] update strategy module stats with trades', () => {
      it('[THEN] it will return strategy module with open return property equals to 0', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ openReturn: 0 }));
      });
      it('[THEN] it will return strategy module with net profit property equal to sum of net return of win trades', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ netProfit: 10 }));
      });
      it('[THEN] it will return strategy module with net loss property equal to sum of net return of loss trades', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ netLoss: -20 }));
      });
      it('[THEN] it will return strategy module with net return property equal to sum of net profit and net loss', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ netReturn: -10 }));
      });
      it('[THEN] it will return strategy module with equity property equal to initial capital plus net return', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ equity: 90 }));
      });
    });
  });

  describe('[GIVEN] there are both opening and closed trades', () => {
    const strategyModule = mockStrategyModule({ initialCapital: 100 });

    const openingTradeBase = mockOpeningTrade(mockFilledMarketOrder({ orderSide: 'ENTRY' }));
    const openingTrade1 = { ...openingTradeBase, unrealizedReturn: 10 as UnrealizedReturn };
    const openingTrade2 = { ...openingTradeBase, unrealizedReturn: 5 as UnrealizedReturn };
    const openingTrades = [openingTrade1, openingTrade2];

    const closedTrade1 = mockClosedTrade(
      mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 10, filledPrice: 5, fee: { amount: 0 } }),
      mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 10, filledPrice: 6, fee: { amount: 0 } }),
    );
    const closedTrade2 = mockClosedTrade(
      mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 10, filledPrice: 10, fee: { amount: 0 } }),
      mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 10, filledPrice: 8, fee: { amount: 0 } }),
    );
    const closedTrades = [closedTrade1, closedTrade2];

    describe('[WHEN] update strategy module stats with trades', () => {
      it('[THEN] it will return strategy module with open return property equals to 0', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ openReturn: 15 }));
      });
      it('[THEN] it will return strategy module with net profit property equal to sum of net return of win trades', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ netProfit: 10 }));
      });
      it('[THEN] it will return strategy module with net loss property equal to sum of net return of loss trades', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ netLoss: -20 }));
      });
      it('[THEN] it will return strategy module with net return property equal to sum of net profit and net loss', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ netReturn: -10 }));
      });
      it('[THEN] it will return strategy module with equity property equal to initial capital plus open return plus net return', () => {
        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ equity: 105 }));
      });
    });
  });

  describe('[GIVEN] difference between new equity after updating and initial capital is greater than the previous max run-up', () => {
    describe('[WHEN] update strategy module stats with trades', () => {
      it('[THEN] it will return strategy module with maxRunup property equals to the difference', () => {
        const strategyModule = mockStrategyModule({ initialCapital: 100, maxRunup: 5 });
        const openingTradeBase = mockOpeningTrade(mockFilledMarketOrder({ orderSide: 'ENTRY' }));
        const openingTrade1 = { ...openingTradeBase, unrealizedReturn: 10 as UnrealizedReturn };
        const openingTrade2 = { ...openingTradeBase, unrealizedReturn: 5 as UnrealizedReturn };
        const openingTrades = [openingTrade1, openingTrade2];
        const closedTrades = [] as ClosedTrade[];

        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ maxRunup: 15 }));
      });
    });
  });

  describe('[GIVEN] difference between new equity after updating and initial capital is less than the previous max draw-down', () => {
    describe('[WHEN] update strategy module stats with trades', () => {
      it('[THEN] it will return strategy module with maxDrawdown property equals to the difference', () => {
        const strategyModule = mockStrategyModule({ initialCapital: 100, maxDrawdown: -10 });
        const openingTradeBase = mockOpeningTrade(mockFilledMarketOrder({ orderSide: 'ENTRY' }));
        const openingTrade1 = { ...openingTradeBase, unrealizedReturn: -10 as UnrealizedReturn };
        const openingTrade2 = { ...openingTradeBase, unrealizedReturn: -15 as UnrealizedReturn };
        const openingTrades = [openingTrade1, openingTrade2];
        const closedTrades = [] as ClosedTrade[];

        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(expect.objectContaining({ maxDrawdown: -25 }));
      });
    });
  });

  describe('[GIVEN] there is no opening or closed trades', () => {
    describe('[WHEN] update strategy module stats with trades', () => {
      it('[THEN] it will return unchanged strategy module', () => {
        const strategyModule = mockStrategyModule();
        const openingTrades = [] as OpeningTrade[];
        const closedTrades = [] as ClosedTrade[];

        const result = updateStrategyModuleStats(strategyModule, openingTrades, closedTrades);

        expect(result).toEqual(strategyModule);
      });
    });
  });
});
