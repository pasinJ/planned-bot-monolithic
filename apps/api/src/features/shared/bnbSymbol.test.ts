import { isGeneralError } from '#shared/errors/generalError.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';

import {
  LotSizeFilter,
  MarketLotSizeFilter,
  MinNotionalFilter,
  NotionalFilter,
  PriceFilter,
  createBnbSymbol,
  isBnbSymbol,
  isOrderTypeAllowed,
  validateWithLotSizeFilter,
  validateWithMarketLotSizeFilter,
  validateWithMinNotionalFilter,
  validateWithNotionalFilter,
  validateWithPriceFilter,
} from './bnbSymbol.js';
import { exchangeNameEnum } from './exchange.js';

describe('UUT: Create Binance symbol', () => {
  const validData = {
    name: 'BTCUSDT',
    exchange: exchangeNameEnum.BINANCE,
    baseAsset: 'BTC',
    baseAssetPrecision: 1,
    quoteAsset: 'USDT',
    quoteAssetPrecision: 1,
    bnbOrderTypes: ['MARKET', 'LIMIT_MAKER', 'STOP_LOSS'],
    filters: [{ type: 'PRICE_FILTER', minPrice: 0, maxPrice: 10, tickSize: 0.001 }],
  };

  describe('[GIVEN] the input data is valid', () => {
    describe('[WHEN] create a Binance symbol', () => {
      it('[THEN] it will return Right of Binance symbol', () => {
        const result = createBnbSymbol(validData);

        expect(result).toEqualRight({ ...validData, orderTypes: ['MARKET', 'LIMIT', 'STOP_MARKET'] });
      });
    });
  });

  describe.each([
    { bnbOrderType: 'MARKET', orderType: 'MARKET' },
    { bnbOrderType: 'LIMIT', orderType: 'LIMIT' },
    { bnbOrderType: 'LIMIT_MAKER', orderType: 'LIMIT' },
    { bnbOrderType: 'STOP_LOSS', orderType: 'STOP_MARKET' },
    { bnbOrderType: 'TAKE_PROFIT', orderType: 'STOP_MARKET' },
    { bnbOrderType: 'STOP_LOSS_LIMIT', orderType: 'STOP_LIMIT' },
    { bnbOrderType: 'TAKE_PROFIT_LIMIT', orderType: 'STOP_LIMIT' },
  ])('[GIVEN] the Binance order types list includes $bnbOrderType type', ({ bnbOrderType, orderType }) => {
    describe('[WHEN] create a Binance symbol', () => {
      it(`[THEN] it will return Right of Binance symbol with order types list that includes ${orderType} type`, () => {
        const data = { ...validData, bnbOrderTypes: [bnbOrderType] };

        const result = createBnbSymbol(data);

        expect(result).toEqualRight({ ...data, orderTypes: [orderType] });
      });
    });
  });

  describe('[GIVEN] the name property of input data is invalid', () => {
    describe.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('[WHEN] create a Binance symbol with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, name: value };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the base asset property of input data is invalid', () => {
    describe.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('[WHEN] create a Binance symbol with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, baseAsset: value };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the base asset precision property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is a float number', value: 1.1 },
    ])('[WHEN] create a Binance symbol with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, baseAssetPrecision: value };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the quote asset property of input data is invalid', () => {
    describe.each([
      { case: 'the property is an empty string', value: '' },
      { case: 'the property is a string with only whitespace', value: ' ' },
    ])('[WHEN] create a Binance symbol with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, quoteAsset: value };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the quote asset precision property of input data is invalid', () => {
    describe.each([
      { case: 'the property is a negative number', value: -1 },
      { case: 'the property is a float number', value: 1.1 },
    ])('[WHEN] create a Binance symbol with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, quoteAssetPrecision: value };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the Binance order types property of input data is invalid', () => {
    describe.each([
      { case: 'the property includes values other than enum value', value: ['MARKET', 'error'] },
      { case: 'the property is an empty array', value: [] },
    ])('[WHEN] create a Binance symbol with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, bnbOrderTypes: value };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the filters property of input data is invalid', () => {
    const priceFilter = { type: 'PRICE_FILTER', minPrice: 0, maxPrice: 10, tickSize: 0.001 };

    describe.each([
      { case: 'the property includes duplicated filter type', value: [priceFilter, priceFilter] },
      { case: 'the property includes invalid filter type', value: [{ type: 'undefined', x: 1 }] },
    ])('[WHEN] create a Binance symbol with $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, filters: value };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the filters property of input data includes an invalid lot size filter', () => {
    const validLotSizeFilter: LotSizeFilter = { type: 'LOT_SIZE', minQty: 1, maxQty: 5, stepSize: 0.001 };

    describe.each([
      { case: 'has negative minimum quantity', value: { ...validLotSizeFilter, minQty: -1 } },
      { case: 'has minimum quantity equals to NaN', value: { ...validLotSizeFilter, minQty: NaN } },
      { case: 'has negative maximum quantity', value: { ...validLotSizeFilter, maxQty: -1 } },
      { case: 'has maximum quantity equals to NaN', value: { ...validLotSizeFilter, maxQty: NaN } },
      { case: 'has maximum quantity equals to 0', value: { ...validLotSizeFilter, maxQty: 0 } },
      { case: 'has negative step size', value: { ...validLotSizeFilter, stepSize: -1 } },
      { case: 'has step size equals to NaN', value: { ...validLotSizeFilter, stepSize: NaN } },
      {
        case: 'has maximum quantity less than minimum quantity',
        value: { ...validLotSizeFilter, minQty: 5, maxQty: 4 },
      },
    ])('[WHEN] create a Binance symbol with a lot size filter that $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, filters: [value] };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the filters property of input data includes an invalid market lot size filter', () => {
    const validMarketLotSizeFilter: MarketLotSizeFilter = {
      type: 'MARKET_LOT_SIZE',
      minQty: 1,
      maxQty: 5,
      stepSize: 0.001,
    };

    describe.each([
      { case: 'has negative minimum quantity', value: { ...validMarketLotSizeFilter, minQty: -1 } },
      { case: 'has minimum quantity equals to NaN', value: { ...validMarketLotSizeFilter, minQty: NaN } },
      { case: 'has negative maximum quantity', value: { ...validMarketLotSizeFilter, maxQty: -1 } },
      { case: 'has maximum quantity equals to NaN', value: { ...validMarketLotSizeFilter, maxQty: NaN } },
      { case: 'has maximum quantity equals to 0', value: { ...validMarketLotSizeFilter, maxQty: 0 } },
      { case: 'has negative step size', value: { ...validMarketLotSizeFilter, stepSize: -1 } },
      { case: 'has step size equals to NaN', value: { ...validMarketLotSizeFilter, stepSize: NaN } },
      {
        case: 'has maximum quantity less than minimum quantity',
        value: { ...validMarketLotSizeFilter, minQty: 5, maxQty: 4 },
      },
    ])('[WHEN] create a Binance symbol with a market lot size filter that $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, filters: [value] };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the filters property of input data includes an invalid min notional filter', () => {
    const validMinNotionalFilter: MinNotionalFilter = {
      type: 'MIN_NOTIONAL',
      minNotional: 1,
      applyToMarket: true,
      avgPriceMins: 0,
    };

    describe.each([
      { case: 'has negative minimum notional', value: { ...validMinNotionalFilter, minNotional: -1 } },
      { case: 'has minimum notional equals to NaN', value: { ...validMinNotionalFilter, minNotional: NaN } },
      { case: 'has negative average price minutes', value: { ...validMinNotionalFilter, avgPriceMins: -1 } },
      { case: 'has average price equals to NaN', value: { ...validMinNotionalFilter, avgPriceMins: NaN } },
      {
        case: 'has average price minutes as a floating number',
        value: { ...validMinNotionalFilter, avgPriceMins: 1.1 },
      },
    ])('[WHEN] create a Binance symbol with a min notional filter that $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, filters: [value] };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the filters property of input data includes an invalid notional filter', () => {
    const validNotionalFilter: NotionalFilter = {
      type: 'NOTIONAL',
      minNotional: 1,
      applyMinToMarket: true,
      maxNotional: 2,
      applyMaxToMarket: false,
      avgPriceMins: 0,
    };

    describe.each([
      { case: 'has negative minimum notional', value: { ...validNotionalFilter, minNotional: -1 } },
      { case: 'has minimum notional equals to NaN', value: { ...validNotionalFilter, minNotional: NaN } },
      { case: 'has negative max notional', value: { ...validNotionalFilter, maxNotional: -1 } },
      { case: 'has max notional equals to NaN', value: { ...validNotionalFilter, maxNotional: NaN } },
      {
        case: 'has max notional less than minimum notional',
        value: { ...validNotionalFilter, minNotional: 5, maxNotional: 4 },
      },
      { case: 'has negative average price minutes', value: { ...validNotionalFilter, avgPriceMins: -1 } },
      { case: 'has average price equals to NaN', value: { ...validNotionalFilter, avgPriceMins: NaN } },
      {
        case: 'has average price minutes as a floating number',
        value: { ...validNotionalFilter, avgPriceMins: 1.1 },
      },
    ])('[WHEN] create a Binance symbol with a notional filter that $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, filters: [value] };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });

  describe('[GIVEN] the filters property of input data includes an invalid price filter', () => {
    const validPriceFilter: PriceFilter = { type: 'PRICE_FILTER', minPrice: 1, maxPrice: 5, tickSize: 0.001 };

    describe.each([
      { case: 'has negative minimum price', value: { ...validPriceFilter, minPrice: -1 } },
      { case: 'has minimum price equals to NaN', value: { ...validPriceFilter, minPrice: NaN } },
      { case: 'has negative maximum price', value: { ...validPriceFilter, maxPrice: -1 } },
      { case: 'has maximum price equals to NaN', value: { ...validPriceFilter, maxPrice: NaN } },
      { case: 'has maximum price equals to 0', value: { ...validPriceFilter, maxPrice: 0 } },
      {
        case: 'has maximum price less than minimum price',
        value: { ...validPriceFilter, minPrice: 5, maxPrice: 4 },
      },
      { case: 'has negative tick size', value: { ...validPriceFilter, tickSize: -1 } },
      { case: 'has tick size equals to NaN', value: { ...validPriceFilter, tickSize: NaN } },
    ])('[WHEN] create a Binance symbol with a price filter that $case', ({ value }) => {
      it('[THEN] it will return Left of error', () => {
        const data = { ...validData, filters: [value] };

        const result = createBnbSymbol(data);

        expect(result).toEqualLeft(expect.toSatisfy(isGeneralError));
      });
    });
  });
});

describe('UUT: Validate if a symbol is a Binance symbol', () => {
  describe('[GIVEN] the input is a Binance symbol', () => {
    describe('[WHEN] validate if a symbol is a Binance symbol', () => {
      it('[THEN] it will return true', () => {
        const symbol = mockBnbSymbol();

        const result = isBnbSymbol(symbol);

        expect(result).toBeTrue();
      });
    });
  });
});

describe('UUT: Validate if an order type is allowed', () => {
  describe('[GIVEN] the order type is in the order types list of symbol', () => {
    describe('[WHEN] validate if the order type is allowed', () => {
      it('[THEN] it will return Right of undefined', () => {
        const orderType = 'MARKET';
        const symbol = mockBnbSymbol({ orderTypes: [orderType] });

        const result = isOrderTypeAllowed(orderType, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] the order type is not in the order types list of symbol', () => {
    describe('[WHEN] validate if the order type is allowed', () => {
      it('[THEN] it will return Left of string', () => {
        const orderType = 'MARKET';
        const symbol = mockBnbSymbol({ orderTypes: ['LIMIT'] });

        const result = isOrderTypeAllowed(orderType, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Validate quantity with lot size filter', () => {
  describe.each([
    { case: 'quantity equals to min quantity', quantity: 1 },
    { case: 'quantity is between min quantity and max quantity', quantity: 3 },
    { case: 'quantity equals to max quantity', quantity: 10 },
  ])(
    '[GIVEN] the symbol has a lot size filter [AND] $case [AND] it is multiple of step size',
    ({ quantity }) => {
      describe('[WHEN] validate quantity with lot size filter', () => {
        it('[THEN] it will return Right of undefined', () => {
          const lotSizeFilter: LotSizeFilter = { type: 'LOT_SIZE', minQty: 1, maxQty: 10, stepSize: 0.1 };
          const symbol = mockBnbSymbol({ filters: [lotSizeFilter] });

          const result = validateWithLotSizeFilter(quantity, symbol);

          expect(result).toEqualRight(undefined);
        });
      });
    },
  );

  describe.each([
    { case: 'quantity is negative', quantity: -1 },
    { case: 'quantity equals to 0', quantity: 0 },
    { case: 'quantity is less than min quantity', quantity: 0.5 },
    { case: 'quantity is more than max quantity', quantity: 11 },
    { case: 'quantity is not multiple of step size', quantity: 1.01 },
  ])('[GIVEN] the symbol has a lot size filter [AND] $case', ({ quantity }) => {
    describe('[WHEN] validate quantity with lot size filter', () => {
      it('[THEN] it will return Left of string', () => {
        const lotSizeFilter: LotSizeFilter = { type: 'LOT_SIZE', minQty: 1, maxQty: 10, stepSize: 0.1 };
        const symbol = mockBnbSymbol({ filters: [lotSizeFilter] });

        const result = validateWithLotSizeFilter(quantity, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the symbol has a lot size filter [AND] step size equals to 0', () => {
    describe('[WHEN] validate quantity with lot size filter', () => {
      it('[THEN] it will return Right of undefined', () => {
        const quantity = 1.001;
        const lotSizeFilter: LotSizeFilter = { type: 'LOT_SIZE', minQty: 1, maxQty: 10, stepSize: 0 };
        const symbol = mockBnbSymbol({ filters: [lotSizeFilter] });

        const result = validateWithLotSizeFilter(quantity, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] the symbol does not have a lot size filter [AND] quantity is more than 0', () => {
    describe('[WHEN] validate quantity with lot size filter', () => {
      it('[THEN] it will return Right of undefined', () => {
        const quantity = 10.5;
        const symbol = mockBnbSymbol({ filters: [] });

        const result = validateWithLotSizeFilter(quantity, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the symbol does not have a lot size filter [BUT] quantity is less than or equal to 0', () => {
    describe('[WHEN] validate quantity with lot size filter', () => {
      it('[THEN] it will return Left of string', () => {
        const quantity = 0;
        const symbol = mockBnbSymbol({ filters: [] });

        const result = validateWithLotSizeFilter(quantity, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Validate quantity with market lot size filter', () => {
  describe.each([
    { case: 'quantity equals to min quantity', quantity: 1 },
    { case: 'quantity is between min quantity and max quantity', quantity: 3 },
    { case: 'quantity equals to max quantity', quantity: 10 },
  ])(
    '[GIVEN] the symbol has a market lot size filter [AND] $case [AND] it is multiple of step size',
    ({ quantity }) => {
      describe('[WHEN] validate quantity with market lot size filter', () => {
        it('[THEN] it will return Right of undefined', () => {
          const notionalFilter: MarketLotSizeFilter = {
            type: 'MARKET_LOT_SIZE',
            minQty: 1,
            maxQty: 10,
            stepSize: 0.1,
          };
          const symbol = mockBnbSymbol({ filters: [notionalFilter] });

          const result = validateWithMarketLotSizeFilter(quantity, symbol);

          expect(result).toEqualRight(undefined);
        });
      });
    },
  );

  describe.each([
    { case: 'quantity is negative', quantity: -1 },
    { case: 'quantity equals to 0', quantity: 0 },
    { case: 'quantity is less than min quantity', quantity: 0.5 },
    { case: 'quantity is more than max quantity', quantity: 11 },
    { case: 'quantity is not multiple of step size', quantity: 1.01 },
  ])('[GIVEN] the symbol has a market lot size filter [AND] $case', ({ quantity }) => {
    describe('[WHEN] validate quantity with market lot size filter', () => {
      it('[THEN] it will return Left of string', () => {
        const notionalFilter: MarketLotSizeFilter = {
          type: 'MARKET_LOT_SIZE',
          minQty: 1,
          maxQty: 10,
          stepSize: 0.1,
        };
        const symbol = mockBnbSymbol({ filters: [notionalFilter] });

        const result = validateWithMarketLotSizeFilter(quantity, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the symbol has lot size filter [AND] step size equals to 0', () => {
    describe('[WHEN] validate quantity with market lot size filter', () => {
      it('[THEN] it will return Right of undefined', () => {
        const quantity = 1.001;
        const notionalFilter: MarketLotSizeFilter = {
          type: 'MARKET_LOT_SIZE',
          minQty: 1,
          maxQty: 10,
          stepSize: 0,
        };
        const symbol = mockBnbSymbol({ filters: [notionalFilter] });

        const result = validateWithMarketLotSizeFilter(quantity, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] the symbol does not have a lot size filter [AND] quantity is more than 0', () => {
    describe('[WHEN] validate quantity with market lot size filter', () => {
      it('[THEN] it will return Right of undefined', () => {
        const quantity = 10.5;
        const symbol = mockBnbSymbol({ filters: [] });

        const result = validateWithMarketLotSizeFilter(quantity, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the symbol does not have a lot size filter [BUT] quantity is less than or equal to 0', () => {
    describe('[WHEN] validate quantity with market lot size filter', () => {
      it('[THEN] it will return Left of string', () => {
        const quantity = -1;
        const symbol = mockBnbSymbol({ filters: [] });

        const result = validateWithMarketLotSizeFilter(quantity, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Validate quantity with min notional filter', () => {
  describe.each([
    { case: 'notional equals to min notional', quantity: 5, price: 1 },
    { case: 'notional is more than min notional', quantity: 3, price: 2 },
  ])(
    '[GIVEN] the symbol has a min notional filter [AND] this is not for market order [AND] $case',
    ({ quantity, price }) => {
      describe('[WHEN] validate quantity with min notional filter', () => {
        it('[THEN] it will return Right of undefined', () => {
          const isMarket = false;
          const minNotionalFilter: MinNotionalFilter = {
            type: 'MIN_NOTIONAL',
            minNotional: 5,
            avgPriceMins: 0,
            applyToMarket: true,
          };
          const symbol = mockBnbSymbol({ filters: [minNotionalFilter] });

          const result = validateWithMinNotionalFilter(quantity, price, isMarket, symbol);

          expect(result).toEqualRight(undefined);
        });
      });
    },
  );
  describe.each([
    { case: 'notional is negative', quantity: 5, price: -1 },
    { case: 'notional equals to 0', quantity: 0, price: 1 },
    { case: 'notional is less than min notional', quantity: 1, price: 2 },
  ])(
    '[GIVEN] the symbol has a min notional filter [AND] this is not for market order [AND] $case',
    ({ quantity, price }) => {
      describe('[WHEN] validate quantity with min notional filter', () => {
        it('[THEN] it will return Left of string', () => {
          const isMarket = false;
          const minNotionalFilter: MinNotionalFilter = {
            type: 'MIN_NOTIONAL',
            minNotional: 5,
            avgPriceMins: 0,
            applyToMarket: true,
          };
          const symbol = mockBnbSymbol({ filters: [minNotionalFilter] });

          const result = validateWithMinNotionalFilter(quantity, price, isMarket, symbol);

          expect(result).toEqualLeft(expect.toBeString());
        });
      });
    },
  );

  describe.each([
    { case: 'notional equals to min notional', quantity: 5, price: 1 },
    { case: 'notional is more than min notional', quantity: 3, price: 2 },
  ])(
    '[GIVEN] the symbol has a min notional filter [AND] this is for market order [AND] apply to market is true [AND] average price minutes equals to 0 [AND] $case',
    ({ quantity, price }) => {
      describe('[WHEN] validate quantity with min notional filter', () => {
        it('[THEN] it will return Right of undefined', () => {
          const isMarket = true;
          const minNotionalFilter: MinNotionalFilter = {
            type: 'MIN_NOTIONAL',
            minNotional: 5,
            avgPriceMins: 0,
            applyToMarket: true,
          };
          const symbol = mockBnbSymbol({ filters: [minNotionalFilter] });

          const result = validateWithMinNotionalFilter(quantity, price, isMarket, symbol);

          expect(result).toEqualRight(undefined);
        });
      });
    },
  );
  describe('[GIVEN] the symbol has a min notional filter [AND] this is for market order [AND] notional is more than 0 [AND] apply to market is true [BUT] average price minutes does not equal to 0', () => {
    describe('[WHEN] validate quantity with min notional filter', () => {
      it('[THEN] it will skip validation and return Right of undefined', () => {
        const quantity = 1;
        const price = 2;
        const isMarket = true;
        const minNotionalFilter: MinNotionalFilter = {
          type: 'MIN_NOTIONAL',
          minNotional: 5,
          avgPriceMins: 1,
          applyToMarket: true,
        };
        const symbol = mockBnbSymbol({ filters: [minNotionalFilter] });

        const result = validateWithMinNotionalFilter(quantity, price, isMarket, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the symbol has a min notional filter [AND] this is for market order [AND] apply to market is true [BUT] average price minutes does not equal to 0 [AND] notional is less than or equal 0', () => {
    describe('[WHEN] validate quantity with min notional filter', () => {
      it('[THEN] it will return Left of string', () => {
        const quantity = -1;
        const price = 2;
        const isMarket = true;
        const minNotionalFilter: MinNotionalFilter = {
          type: 'MIN_NOTIONAL',
          minNotional: 5,
          avgPriceMins: 1,
          applyToMarket: true,
        };
        const symbol = mockBnbSymbol({ filters: [minNotionalFilter] });

        const result = validateWithMinNotionalFilter(quantity, price, isMarket, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
  describe('[GIVEN] the symbol has a min notional filter [AND] this is for market order [AND] notional is more than 0 [AND] average price minutes equal to 0 [BUT] apply to market is false', () => {
    describe('[WHEN] validate quantity with min notional filter', () => {
      it('[THEN] it will skip validation and return Right of undefined', () => {
        const quantity = 1;
        const price = 2;
        const isMarket = true;
        const minNotionalFilter: MinNotionalFilter = {
          type: 'MIN_NOTIONAL',
          minNotional: 5,
          avgPriceMins: 0,
          applyToMarket: false,
        };
        const symbol = mockBnbSymbol({ filters: [minNotionalFilter] });

        const result = validateWithMinNotionalFilter(quantity, price, isMarket, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the symbol has a min notional filter [AND] this is for market order [AND] average price minutes equal to 0 [BUT] apply to market is false [AND] notional is less than or equal 0', () => {
    describe('[WHEN] validate quantity with min notional filter', () => {
      it('[THEN] it will return Left of string', () => {
        const quantity = 0;
        const price = 2;
        const isMarket = true;
        const minNotionalFilter: MinNotionalFilter = {
          type: 'MIN_NOTIONAL',
          minNotional: 5,
          avgPriceMins: 0,
          applyToMarket: false,
        };
        const symbol = mockBnbSymbol({ filters: [minNotionalFilter] });

        const result = validateWithMinNotionalFilter(quantity, price, isMarket, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the symbol does not have a min notional filter [AND] notional is more than 0', () => {
    describe('[WHEN] validate quantity with min notional filter', () => {
      it('[THEN] it will return Right of undefined', () => {
        const quantity = 1;
        const price = 1;
        const isMarket = true;
        const symbol = mockBnbSymbol({ filters: [] });

        const result = validateWithMinNotionalFilter(quantity, price, isMarket, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the symbol does not have a min notional filter [BUT] notional is less than or equal to 0', () => {
    describe('[WHEN] validate quantity with min notional filter', () => {
      it('[THEN] it will return Left of string', () => {
        const quantity = -1;
        const price = 1;
        const isMarket = true;
        const symbol = mockBnbSymbol({ filters: [] });

        const result = validateWithMinNotionalFilter(quantity, price, isMarket, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Validate quantity with notional filter', () => {
  describe.each([
    { case: 'notional equals to min notional', quantity: 5, price: 1 },
    { case: 'notional is between min notional and max notional', quantity: 3, price: 2 },
    { case: 'notional equals to max notional', quantity: 5, price: 2 },
  ])(
    '[GIVEN] the symbol has a notional filter [AND] this is not for market order [AND] $case',
    ({ quantity, price }) => {
      describe('[WHEN] validate quantity with min notional filter', () => {
        it('[THEN] it will return Right of undefined', () => {
          const isMarket = false;
          const notionalFilter: NotionalFilter = {
            type: 'NOTIONAL',
            minNotional: 5,
            applyMinToMarket: true,
            maxNotional: 10,
            applyMaxToMarket: true,
            avgPriceMins: 0,
          };
          const symbol = mockBnbSymbol({ filters: [notionalFilter] });

          const result = validateWithNotionalFilter(quantity, price, isMarket, symbol);

          expect(result).toEqualRight(undefined);
        });
      });
    },
  );
  describe.each([
    { case: 'notional is negative', quantity: 5, price: -1 },
    { case: 'notional equals to 0', quantity: 0, price: 1 },
    { case: 'notional is less than min notional', quantity: 1, price: 2 },
    { case: 'notional is more than max notional', quantity: 10, price: 2 },
  ])(
    '[GIVEN] the symbol has a notional filter [AND] this is not for market order [AND] $case',
    ({ quantity, price }) => {
      describe('[WHEN] validate quantity with notional filter', () => {
        it('[THEN] it will return Left of string', () => {
          const isMarket = false;
          const notionalFilter: NotionalFilter = {
            type: 'NOTIONAL',
            minNotional: 5,
            applyMinToMarket: true,
            maxNotional: 10,
            applyMaxToMarket: true,
            avgPriceMins: 0,
          };
          const symbol = mockBnbSymbol({ filters: [notionalFilter] });

          const result = validateWithNotionalFilter(quantity, price, isMarket, symbol);

          expect(result).toEqualLeft(expect.toBeString());
        });
      });
    },
  );

  describe.each([
    { case: 'notional equals to min notional', quantity: 5, price: 1 },
    { case: 'notional is between min notional and max notional', quantity: 3, price: 2 },
    { case: 'notional equals to max notional', quantity: 2, price: 5 },
  ])(
    '[GIVEN] the symbol has a notional filter [AND] this is for market order [AND] apply min and max to market is true [AND] average price minutes equals to 0 [AND] $case',
    ({ quantity, price }) => {
      describe('[WHEN] validate quantity with notional filter', () => {
        it('[THEN] it will return Right of undefined', () => {
          const isMarket = true;
          const notionalFilter: NotionalFilter = {
            type: 'NOTIONAL',
            minNotional: 5,
            applyMinToMarket: true,
            maxNotional: 10,
            applyMaxToMarket: true,
            avgPriceMins: 0,
          };
          const symbol = mockBnbSymbol({ filters: [notionalFilter] });

          const result = validateWithNotionalFilter(quantity, price, isMarket, symbol);

          expect(result).toEqualRight(undefined);
        });
      });
    },
  );
  describe.each([
    { case: 'notional equals to min notional', quantity: 5, price: 1 },
    { case: 'notional is between min notional and max notional', quantity: 3, price: 2 },
    { case: 'notional equals to max notional', quantity: 2, price: 5 },
    { case: 'notional is more than max notional', quantity: 3, price: 5 },
  ])(
    '[GIVEN] the symbol has a notional filter [AND] this is for market order [AND] average price minutes equals to 0 [AND] apply min to market is true [AND] $case [BUT] apply max to market is false',
    ({ quantity, price }) => {
      describe('[WHEN] validate quantity with notional filter', () => {
        it('[THEN] it will return Right of undefined', () => {
          const isMarket = true;
          const notionalFilter: NotionalFilter = {
            type: 'NOTIONAL',
            minNotional: 5,
            applyMinToMarket: true,
            maxNotional: 10,
            applyMaxToMarket: false,
            avgPriceMins: 0,
          };
          const symbol = mockBnbSymbol({ filters: [notionalFilter] });

          const result = validateWithNotionalFilter(quantity, price, isMarket, symbol);

          expect(result).toEqualRight(undefined);
        });
      });
    },
  );
  describe.each([
    { case: 'notional is less than min notional', quantity: 2, price: 1 },
    { case: 'notional equals to min notional', quantity: 5, price: 1 },
    { case: 'notional is between min notional and max notional', quantity: 3, price: 2 },
    { case: 'notional equals to max notional', quantity: 2, price: 5 },
  ])(
    '[GIVEN] the symbol has a notional filter [AND] this is for market order [AND] average price minutes equals to 0 [AND] apply max to market is true [AND] $case [BUT] apply min to market is false',
    ({ quantity, price }) => {
      describe('[WHEN] validate quantity with notional filter', () => {
        it('[THEN] it will return Right of undefined', () => {
          const isMarket = true;
          const notionalFilter: NotionalFilter = {
            type: 'NOTIONAL',
            minNotional: 5,
            applyMinToMarket: false,
            maxNotional: 10,
            applyMaxToMarket: true,
            avgPriceMins: 0,
          };
          const symbol = mockBnbSymbol({ filters: [notionalFilter] });

          const result = validateWithNotionalFilter(quantity, price, isMarket, symbol);

          expect(result).toEqualRight(undefined);
        });
      });
    },
  );
  describe('[GIVEN] the symbol has a notional filter [AND] this is for market order [AND] notional is more than 0 [AND] apply min and max to market are true [BUT] average price minutes does not equal to 0', () => {
    describe('[WHEN] validate quantity with min notional filter', () => {
      it('[THEN] it will skip validation and return Right of undefined', () => {
        const quantity = 1;
        const price = 2;
        const isMarket = true;
        const notionalFilter: NotionalFilter = {
          type: 'NOTIONAL',
          minNotional: 5,
          applyMinToMarket: true,
          maxNotional: 10,
          applyMaxToMarket: true,
          avgPriceMins: 1,
        };
        const symbol = mockBnbSymbol({ filters: [notionalFilter] });

        const result = validateWithNotionalFilter(quantity, price, isMarket, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe.each([
    { case: 'notional is negative', quantity: 5, price: -1 },
    { case: 'notional equals to 0', quantity: 0, price: 1 },
    { case: 'notional is less than min notional', quantity: 1, price: 2 },
    { case: 'notional is more than max notional', quantity: 10, price: 2 },
  ])(
    '[GIVEN] the symbol has a notional filter [AND] this is for market order [AND] apply min and max to market are true [AND] average price minutes equals to 0 [AND] $case',
    ({ quantity, price }) => {
      describe('[WHEN] validate quantity with notional filter', () => {
        it('[THEN] it will return Left of string', () => {
          const isMarket = true;
          const notionalFilter: NotionalFilter = {
            type: 'NOTIONAL',
            minNotional: 5,
            applyMinToMarket: true,
            maxNotional: 10,
            applyMaxToMarket: true,
            avgPriceMins: 0,
          };
          const symbol = mockBnbSymbol({ filters: [notionalFilter] });

          const result = validateWithNotionalFilter(quantity, price, isMarket, symbol);

          expect(result).toEqualLeft(expect.toBeString());
        });
      });
    },
  );

  describe('[GIVEN] the symbol does not have a notional filter [AND] notional is more than 0', () => {
    describe('[WHEN] validate quantity with notional filter', () => {
      it('[THEN] it will return Right of undefined', () => {
        const quantity = 1;
        const price = 1;
        const isMarket = true;
        const symbol = mockBnbSymbol({ filters: [] });

        const result = validateWithNotionalFilter(quantity, price, isMarket, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the symbol does not have a notional filter [BUT] notional is less than or equal to 0', () => {
    describe('[WHEN] validate quantity with notional filter', () => {
      it('[THEN] it will return Left of string', () => {
        const quantity = 1;
        const price = 0;
        const isMarket = true;
        const symbol = mockBnbSymbol({ filters: [] });

        const result = validateWithNotionalFilter(quantity, price, isMarket, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Validate price with price filter', () => {
  describe.each([
    { case: 'price equals to min price', price: 1 },
    { case: 'price is between min price and max price', price: 3 },
    { case: 'price equals to max price', price: 10 },
  ])('[GIVEN] the symbol has a price filter [AND] $case [AND] it is multiple of tick size', ({ price }) => {
    describe('[WHEN] validate price with price filter', () => {
      it('[THEN] it will return Right of undefined', () => {
        const priceFilter: PriceFilter = { type: 'PRICE_FILTER', minPrice: 1, maxPrice: 10, tickSize: 0.1 };
        const symbol = mockBnbSymbol({ filters: [priceFilter] });

        const result = validateWithPriceFilter(price, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe.each([
    { case: 'price is negative', price: -1 },
    { case: 'price equals to 0', price: 0 },
    { case: 'price is less than min price', price: 0.5 },
    { case: 'price is more than max price', price: 11 },
    { case: 'price is not multiple of step size', price: 1.01 },
  ])('[GIVEN] the symbol has a price filter [AND] $case', ({ price }) => {
    describe('[WHEN] validate price with price filter', () => {
      it('[THEN] it will return Left of string', () => {
        const priceFilter: PriceFilter = { type: 'PRICE_FILTER', minPrice: 1, maxPrice: 10, tickSize: 0.1 };
        const symbol = mockBnbSymbol({ filters: [priceFilter] });

        const result = validateWithPriceFilter(price, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the symbol has a price filter [AND] tick size equals to 0', () => {
    describe('[WHEN] validate price with price filter', () => {
      it('[THEN] it will return Right of undefined', () => {
        const price = 1.001;
        const priceFilter: PriceFilter = { type: 'PRICE_FILTER', minPrice: 1, maxPrice: 10, tickSize: 0 };
        const symbol = mockBnbSymbol({ filters: [priceFilter] });

        const result = validateWithPriceFilter(price, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] the symbol does not have a price filter [AND] price is more than 0', () => {
    describe('[WHEN] validate price with price filter', () => {
      it('[THEN] it will return Right of undefined', () => {
        const price = 10.5;
        const symbol = mockBnbSymbol({ filters: [] });

        const result = validateWithPriceFilter(price, symbol);

        expect(result).toEqualRight(undefined);
      });
    });
  });
  describe('[GIVEN] the symbol does not have a price filter [BUT] price is less than or equal to 0', () => {
    describe('[WHEN] validate price with price filter', () => {
      it('[THEN] it will return Left of string', () => {
        const price = 0;
        const symbol = mockBnbSymbol({ filters: [] });

        const result = validateWithPriceFilter(price, symbol);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});
