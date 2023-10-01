import { Price } from '#features/btStrategies/dataModels/kline.js';
import {
  mockPendingLimitOrder,
  mockPendingMarketOrder,
  mockPendingStopLimitOrder,
  mockPendingStopMarketOrder,
} from '#test-utils/features/shared/order.js';
import {
  mockLotSizeFilter,
  mockMarketLotSizeFilter,
  mockMinNotionalFilter,
  mockNotionalFilter,
  mockPriceFilter,
  mockSymbol,
} from '#test-utils/features/symbols/models.js';

import {
  isOrderTypeAllowed,
  validateLimitPrice,
  validateMarketNotional,
  validateNotional,
  validateQuantity,
  validateStopPrice,
} from './orderValidation.js';

describe('UUT: Check if a order type is allowed', () => {
  describe("[GIVEN] the symbol's order types include the input order type", () => {
    describe('[WHEN] check if the order type is allowed', () => {
      it('[THEN] it will return Right of undefined', () => {
        const orderType = 'MARKET';
        const symbol = mockSymbol({ orderTypes: [orderType] });

        const result = isOrderTypeAllowed(orderType, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe("[GIVEN] the symbol's order types do not include the input order type", () => {
    describe('[WHEN] check if the order type is allowed', () => {
      it('[THEN] it will return Left of string', () => {
        const orderType = 'MARKET';
        const symbol = mockSymbol({ orderTypes: ['LIMIT'] });

        const result = isOrderTypeAllowed(orderType, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Validate quantity', () => {
  describe('[GIVEN] quantity is less than or equal to 0', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol();
        const order = mockPendingLimitOrder({ quantity: -1 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] order type is MARKET [AND] quantity is greater than 0 [AND] it satisfies market lot size filter', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({
          filters: [mockMarketLotSizeFilter({ minQty: 1, maxQty: 10, stepSize: 0.01 })],
        });
        const order = mockPendingMarketOrder({ quantity: 5 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] order type is MARKET [AND] quantity is greater than 0 [AND] it satisfies lot size filter', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({
          filters: [mockLotSizeFilter({ minQty: 1, maxQty: 10, stepSize: 0.01 })],
        });
        const order = mockPendingMarketOrder({ quantity: 5 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] order type is MARKET [AND] quantity is greater than 0 [AND] it satisfies market lot size filter [BUT] it does not satisfies lot size filter', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({
          filters: [
            mockMarketLotSizeFilter({ minQty: 1, maxQty: 10, stepSize: 0.01 }),
            mockLotSizeFilter({ minQty: 5, maxQty: 10, stepSize: 0.01 }),
          ],
        });
        const order = mockPendingMarketOrder({ quantity: 4 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] order type is MARKET [AND] quantity is greater than 0 [BUT] it less than min quantity of market lot size filter', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({
          filters: [mockMarketLotSizeFilter({ minQty: 5, maxQty: 10, stepSize: 0.01 })],
        });
        const order = mockPendingMarketOrder({ quantity: 4 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] order type is MARKET [AND] quantity is greater than 0 [BUT] it greater than max quantity of market lot size filter', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({
          filters: [mockMarketLotSizeFilter({ minQty: 5, maxQty: 10, stepSize: 0.01 })],
        });
        const order = mockPendingMarketOrder({ quantity: 11 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] order type is MARKET [AND] quantity is greater than 0 [BUT] it is not multiple of step size of market lot size filter', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({
          filters: [mockMarketLotSizeFilter({ minQty: 5, maxQty: 10, stepSize: 0.01 })],
        });
        const order = mockPendingMarketOrder({ quantity: 5.001 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] order type is MARKET [AND] quantity is greater than 0 [AND] it is between min quantity and max quantity [AND] step size of market lot size filter = 0', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({
          filters: [mockMarketLotSizeFilter({ minQty: 1, maxQty: 10, stepSize: 0 })],
        });
        const order = mockPendingMarketOrder({ quantity: 5 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] order type is not MARKET [AND] quantity is greater than 0 [AND] it satisfies lot size filter', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({
          filters: [mockLotSizeFilter({ minQty: 1, maxQty: 10, stepSize: 0.01 })],
        });
        const order = mockPendingLimitOrder({ quantity: 5 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] order type is not MARKET [AND] quantity is greater than 0 [BUT] it less than min quantity of lot size filter', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({
          filters: [mockLotSizeFilter({ minQty: 5, maxQty: 10, stepSize: 0.01 })],
        });
        const order = mockPendingLimitOrder({ quantity: 4 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] order type is not MARKET [AND] quantity is greater than 0 [BUT] it greater than min quantity of lot size filter', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({
          filters: [mockLotSizeFilter({ minQty: 5, maxQty: 10, stepSize: 0.01 })],
        });
        const order = mockPendingLimitOrder({ quantity: 11 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] order type is not MARKET [AND] quantity is greater than 0 [BUT] it is not multiple of step size of lot size filter', () => {
    describe('[WHEN] validate quantity', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({
          filters: [mockLotSizeFilter({ minQty: 5, maxQty: 10, stepSize: 0.01 })],
        });
        const order = mockPendingLimitOrder({ quantity: 6.001 });

        const result = validateQuantity(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Validate limit price', () => {
  describe('[GIVEN] limit price of the order satisfies the price filter', () => {
    describe('[WHEN] validate limit price', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ minPrice: 1, maxPrice: 10, tickSize: 1 })] });
        const order = mockPendingLimitOrder({ limitPrice: 5 });

        const result = validateLimitPrice(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] min price of price filter equals to 0 [AND] limit price of the order satisfies the price filter', () => {
    describe('[WHEN] validate limit price', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ minPrice: 0, maxPrice: 10, tickSize: 1 })] });
        const order = mockPendingLimitOrder({ limitPrice: 1 });

        const result = validateLimitPrice(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] max price of price filter equals to 0 [AND] limit price of the order satisfies the price filter', () => {
    describe('[WHEN] validate limit price', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ minPrice: 2, maxPrice: 0, tickSize: 1 })] });
        const order = mockPendingLimitOrder({ limitPrice: 3 });

        const result = validateLimitPrice(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] tick size of price filter equals to 0 [AND] limit price of the order satisfies the price filter', () => {
    describe('[WHEN] validate limit price', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ minPrice: 1, maxPrice: 10, tickSize: 0 })] });
        const order = mockPendingLimitOrder({ limitPrice: 3 });

        const result = validateLimitPrice(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] limit price of the order is less than or equal to 0', () => {
    describe('[WHEN] validate limit price', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol();
        const order = mockPendingLimitOrder({ limitPrice: -1 });

        const result = validateLimitPrice(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] limit price of the order is less than min price of price filter', () => {
    describe('[WHEN] validate limit price', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ minPrice: 5 })] });
        const order = mockPendingLimitOrder({ limitPrice: 3 });

        const result = validateLimitPrice(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] limit price of the order is greater than max price of price filter', () => {
    describe('[WHEN] validate limit price', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ maxPrice: 10 })] });
        const order = mockPendingLimitOrder({ limitPrice: 11 });

        const result = validateLimitPrice(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] limit price of the order is not multiple of tick size of price filter', () => {
    describe('[WHEN] validate limit price', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({
          filters: [mockPriceFilter({ minPrice: 1, maxPrice: 10, tickSize: 0.1 })],
        });
        const order = mockPendingLimitOrder({ limitPrice: 1.001 });

        const result = validateLimitPrice(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Validate stop price', () => {
  describe('[GIVEN] stop price of the order satisfies the price filter', () => {
    describe('[WHEN] validate stop price', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ minPrice: 1, maxPrice: 10, tickSize: 1 })] });
        const order = mockPendingStopMarketOrder({ stopPrice: 5 });

        const result = validateStopPrice(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] min price of price filter equals to 0 [AND] stop price of the order satisfies the price filter', () => {
    describe('[WHEN] validate stop price', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ minPrice: 0, maxPrice: 10, tickSize: 1 })] });
        const order = mockPendingStopMarketOrder({ stopPrice: 5 });

        const result = validateStopPrice(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] max price of price filter equals to 0 [AND] stop price of the order satisfies the price filter', () => {
    describe('[WHEN] validate stop price', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ minPrice: 1, maxPrice: 0, tickSize: 1 })] });
        const order = mockPendingStopMarketOrder({ stopPrice: 5 });

        const result = validateStopPrice(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] tick size of price filter equals to 0 [AND] stop price of the order satisfies the price filter', () => {
    describe('[WHEN] validate stop price', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ minPrice: 1, maxPrice: 10, tickSize: 0 })] });
        const order = mockPendingStopMarketOrder({ stopPrice: 5 });

        const result = validateStopPrice(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] stop price of the order is less than or equal to 0', () => {
    describe('[WHEN] validate stop price', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol();
        const order = mockPendingStopMarketOrder({ stopPrice: -1 });

        const result = validateStopPrice(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] stop price of the order is less than min price of price filter', () => {
    describe('[WHEN] validate stop price', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ minPrice: 5 })] });
        const order = mockPendingStopMarketOrder({ stopPrice: 3 });

        const result = validateStopPrice(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] stop price of the order is greater than max price of price filter', () => {
    describe('[WHEN] validate stop price', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockPriceFilter({ maxPrice: 10 })] });
        const order = mockPendingStopMarketOrder({ stopPrice: 11 });

        const result = validateStopPrice(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] stop price of the order is not multiple of tick size of price filter', () => {
    describe('[WHEN] validate stop price', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({
          filters: [mockPriceFilter({ minPrice: 1, maxPrice: 10, tickSize: 0.1 })],
        });
        const order = mockPendingStopMarketOrder({ stopPrice: 1.001 });

        const result = validateStopPrice(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Validate market notional', () => {
  describe('[GIVEN] min notional filter exists and has applyToMarket = true and avgPriceMins = 0 [AND] the current price * quantity is greater than or equal to min notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const minNotionalFilter = mockMinNotionalFilter({
          applyToMarket: true,
          avgPriceMins: 0,
          minNotional: 1,
        });
        const symbol = mockSymbol({ filters: [minNotionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] min notional filter exists and has applyToMarket = true and avgPriceMins = 0 [BUT] the current price * quantity is less than min notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will return Left of string', () => {
        const minNotionalFilter = mockMinNotionalFilter({
          applyToMarket: true,
          avgPriceMins: 0,
          minNotional: 15,
        });
        const symbol = mockSymbol({ filters: [minNotionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] min notional filter exists and has applyToMarket = false and avgPriceMins = 0 [AND] the current price * quantity is less than min notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will skip validating and return Right of undefined', () => {
        const minNotionalFilter = mockMinNotionalFilter({
          applyToMarket: false,
          avgPriceMins: 0,
          minNotional: 15,
        });
        const symbol = mockSymbol({ filters: [minNotionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] min notional filter exists and has applyToMarket = true and avgPriceMins != 0 [AND] the current price * quantity is less than min notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will skip validating and return Right of undefined', () => {
        const minNotionalFilter = mockMinNotionalFilter({
          applyToMarket: true,
          avgPriceMins: 5,
          minNotional: 15,
        });
        const symbol = mockSymbol({ filters: [minNotionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] notional filter exists and has applyMinToMarket = true and avgPriceMins = 0 [AND] the current price * quantity is greater than or equal to min notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const notionalFilter = mockNotionalFilter({
          applyMinToMarket: true,
          avgPriceMins: 0,
          minNotional: 1,
          applyMaxToMarket: false,
        });
        const symbol = mockSymbol({ filters: [notionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] notional filter exists and has applyMinToMarket = true and avgPriceMins = 0 [AND] the current price * quantity is less than min notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will return Left of string', () => {
        const notionalFilter = mockNotionalFilter({
          applyMinToMarket: true,
          avgPriceMins: 0,
          minNotional: 15,
          applyMaxToMarket: false,
        });
        const symbol = mockSymbol({ filters: [notionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] notional filter exists and has applyMinToMarket = false and avgPriceMins = 0 [AND] the current price * quantity is less than min notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const notionalFilter = mockNotionalFilter({
          applyMinToMarket: false,
          avgPriceMins: 0,
          minNotional: 15,
          applyMaxToMarket: false,
        });
        const symbol = mockSymbol({ filters: [notionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] notional filter exists and has applyMinToMarket = true and avgPriceMins != 0 [AND] the current price * quantity is less than min notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const notionalFilter = mockNotionalFilter({
          applyMinToMarket: true,
          avgPriceMins: 1,
          minNotional: 15,
          applyMaxToMarket: false,
        });
        const symbol = mockSymbol({ filters: [notionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] notional filter exists and has applyMaxToMarket = true and avgPriceMins = 0 [AND] the current price * quantity is less than or equal to max notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const notionalFilter = mockNotionalFilter({
          applyMaxToMarket: true,
          avgPriceMins: 0,
          maxNotional: 15,
          applyMinToMarket: false,
        });
        const symbol = mockSymbol({ filters: [notionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] notional filter exists and has applyMaxToMarket = true and avgPriceMins = 0 [AND] the current price * quantity is greater than max notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will return Left of string', () => {
        const notionalFilter = mockNotionalFilter({
          applyMaxToMarket: true,
          avgPriceMins: 0,
          maxNotional: 5,
          applyMinToMarket: false,
        });
        const symbol = mockSymbol({ filters: [notionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] notional filter exists and has applyMaxToMarket = false and avgPriceMins = 0 [AND] the current price * quantity is greater than max notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const notionalFilter = mockNotionalFilter({
          applyMaxToMarket: false,
          avgPriceMins: 0,
          maxNotional: 5,
          applyMinToMarket: false,
        });
        const symbol = mockSymbol({ filters: [notionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] notional filter exists and has applyMaxToMarket = true and avgPriceMins != 0 [AND] the current price * quantity is greater than max notional', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const notionalFilter = mockNotionalFilter({
          applyMaxToMarket: true,
          avgPriceMins: 1,
          maxNotional: 5,
          applyMinToMarket: false,
        });
        const symbol = mockSymbol({ filters: [notionalFilter] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] min notional and notional filters do not exist', () => {
    describe('[WHEN] validate market notional', () => {
      it('[THEN] it will skip validating and return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [] });
        const order = mockPendingMarketOrder({ quantity: 1 });
        const currentPrice = 10 as Price;

        const result = validateMarketNotional(order, symbol, currentPrice);

        expect(result).toEqualRight(undefined);
      });
    });
  });
});

describe('UUT: Validate notional', () => {
  describe('[GIVEN] the order is LIMIT order [AND] min notional filter exists [AND] the limit price * quantity is greater than or equal to min notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockMinNotionalFilter({ minNotional: 1 })] });
        const order = mockPendingLimitOrder({ quantity: 1, limitPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the order is LIMIT order [AND] min notional filter exists [BUT] the limit price * quantity is less than min notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockMinNotionalFilter({ minNotional: 15 })] });
        const order = mockPendingLimitOrder({ quantity: 1, limitPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] the order is LIMIT order [AND] notional filter exists [AND] the limit price * quantity is between min notional and max notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockNotionalFilter({ minNotional: 1, maxNotional: 15 })] });
        const order = mockPendingLimitOrder({ quantity: 1, limitPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the order is LIMIT order [AND] notional filter exists [BUT] the limit price * quantity is less than min notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockNotionalFilter({ minNotional: 15, maxNotional: 15 })] });
        const order = mockPendingLimitOrder({ quantity: 1, limitPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] the order is LIMIT order [AND] notional filter exists [BUT] the limit price * quantity is greater than max notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockNotionalFilter({ minNotional: 1, maxNotional: 5 })] });
        const order = mockPendingLimitOrder({ quantity: 1, limitPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] the order is LIMIT order [AND] min notional and notional filters do not exist', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [] });
        const order = mockPendingLimitOrder({ quantity: 1, limitPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] the order is STOP_MARKET order [AND] min notional filter exists [AND] the stop price * quantity is greater than or equal to min notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockMinNotionalFilter({ minNotional: 1 })] });
        const order = mockPendingStopMarketOrder({ quantity: 1, stopPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the order is STOP_MARKET order [AND] min notional filter exists [AND] the stop price * quantity is less than min notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockMinNotionalFilter({ minNotional: 15 })] });
        const order = mockPendingStopMarketOrder({ quantity: 1, stopPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] the order is STOP_MARKET order [AND] notional filter exists [AND] the stop price * quantity is between min notional and max notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockNotionalFilter({ minNotional: 1, maxNotional: 15 })] });
        const order = mockPendingStopMarketOrder({ quantity: 1, stopPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the order is STOP_MARKET order [AND] notional filter exists [AND] the stop price * quantity is less than min notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockNotionalFilter({ minNotional: 15, maxNotional: 15 })] });
        const order = mockPendingStopMarketOrder({ quantity: 1, stopPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] the order is STOP_MARKET order [AND] notional filter exists [AND] the stop price * quantity is greater than max notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockNotionalFilter({ minNotional: 1, maxNotional: 5 })] });
        const order = mockPendingStopMarketOrder({ quantity: 1, stopPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] the order is STOP_MARKET order [AND] min notional and notional filters do not exist', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [] });
        const order = mockPendingStopMarketOrder({ quantity: 1, stopPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] the order is STOP_LIMIT order [AND] min notional filter exists [AND] (the limit price * quantity) and (the stop price * quantity) is greater than or equal to min notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockMinNotionalFilter({ minNotional: 1 })] });
        const order = mockPendingStopLimitOrder({ quantity: 1, stopPrice: 10, limitPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the order is STOP_LIMIT order [AND] min notional filter exists [AND] (the limit price * quantity) or (the stop price * quantity) is less than min notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockMinNotionalFilter({ minNotional: 15 })] });
        const order = mockPendingStopLimitOrder({ quantity: 1, stopPrice: 10, limitPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] the order is STOP_LIMIT order [AND] notional filter exists [AND] (the limit price * quantity) and (the stop price * quantity) is between min notional and max notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [mockNotionalFilter({ minNotional: 1, maxNotional: 15 })] });
        const order = mockPendingStopLimitOrder({ quantity: 1, stopPrice: 10, limitPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the order is STOP_LIMIT order [AND] notional filter exists [AND] (the limit price * quantity) or (the stop price * quantity) is less than min notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockNotionalFilter({ minNotional: 15, maxNotional: 15 })] });
        const order = mockPendingStopLimitOrder({ quantity: 1, stopPrice: 10, limitPrice: 15 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] the order is STOP_LIMIT order [AND] notional filter exists [AND] (the limit price * quantity) or (the stop price * quantity) is greater than max notional', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Left of string', () => {
        const symbol = mockSymbol({ filters: [mockNotionalFilter({ minNotional: 1, maxNotional: 5 })] });
        const order = mockPendingStopLimitOrder({ quantity: 1, stopPrice: 10, limitPrice: 4 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] the order is STOP_LIMIT order [AND] min notional and notional filters do not exist', () => {
    describe('[WHEN] validate notional', () => {
      it('[THEN] it will return Right of undefined', () => {
        const symbol = mockSymbol({ filters: [] });
        const order = mockPendingStopLimitOrder({ quantity: 1, stopPrice: 10, limitPrice: 10 });

        const result = validateNotional(order, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
});
