import { ValidDate } from '#shared/utils/date.js';
import {
  mockOpeningLimitOrder,
  mockOpeningStopLimitOrder,
  mockOpeningStopMarketOrder,
  mockPendingCancelOrder,
  mockPendingLimitOrder,
  mockPendingMarketOrder,
  mockPendingStopMarketOrder,
} from '#test-utils/features/shared/order.js';

import { Price } from './kline.js';
import {
  OrderId,
  PendingOrder,
  calculateFee,
  createFilledOrder,
  createOpeningOrder,
  createPendingOrderRequest,
  createRejectedOrder,
  createSubmittedOrder,
} from './order.js';
import { MakerFeeRate, TakerFeeRate } from './strategy.js';
import { AssetName } from './symbol.js';

describe('UUT: Create pending order request', () => {
  describe('[WHEN] create a pending order request', () => {
    it('[THEN] it will return a pending order request', () => {
      const request = { orderSide: 'ENTRY', type: 'MARKET', quantity: 1 } as const;
      const orderId = 'nqAPDnvL1V' as OrderId;
      const currentDate = new Date('2021-12-12') as ValidDate;

      const result = createPendingOrderRequest(request, orderId, currentDate);

      expect(result).toEqual({ ...request, id: orderId, status: 'PENDING', createdAt: currentDate });
    });
  });
});

describe('UUT: Create submitted order', () => {
  describe('[WHEN] create a submitted order', () => {
    it('[THEN] it will return a submitted order', () => {
      const cancelOrder = mockPendingCancelOrder();
      const currentDate = new Date('2021-12-12') as ValidDate;

      const result = createSubmittedOrder(cancelOrder, currentDate);

      expect(result).toEqual({ ...cancelOrder, status: 'SUBMITTED', submittedAt: currentDate });
    });
  });
});

describe('UUT: Create opening order', () => {
  describe('[WHEN] create a opening order', () => {
    it('[THEN] it will return a opening order', () => {
      const pendingOrder: PendingOrder = mockPendingStopMarketOrder();
      const currentDate = new Date('2021-12-12') as ValidDate;

      const result = createOpeningOrder(pendingOrder, currentDate);

      expect(result).toEqual({ ...pendingOrder, status: 'OPENING', submittedAt: currentDate });
    });
  });
});

describe('UUT: Create filled order', () => {
  describe('[WHEN] create a filled order', () => {
    it('[THEN] it will return a filled order', () => {
      const openingOrder = mockOpeningLimitOrder({ quantity: 1 });
      const currentDate = new Date('2021-10-12') as ValidDate;
      const filledPrice = 10 as Price;
      const feeRates = { takerFeeRate: 1 as TakerFeeRate, makerFeeRate: 2 as MakerFeeRate };
      const currencies = { capitalCurrency: 'USDT' as AssetName, assetCurrency: 'BTC' as AssetName };

      const result = createFilledOrder(openingOrder, currentDate, filledPrice, feeRates, currencies);

      expect(result).toEqual({
        ...openingOrder,
        filledPrice,
        fee: { amount: 0.02, currency: currencies.assetCurrency },
        status: 'FILLED',
        filledAt: currentDate,
      });
    });
  });
});

describe('UUT: Create rejected order', () => {
  describe('[WHEN] create a rejected order', () => {
    it('[THEN] it will return a rejected order', () => {
      const pendingOrder = mockPendingLimitOrder();
      const reason = 'Error';
      const currentDate = new Date('2010-10-02') as ValidDate;

      const result = createRejectedOrder(pendingOrder, reason, currentDate);

      expect(result).toEqual({ ...pendingOrder, status: 'REJECTED', reason, submittedAt: currentDate });
    });
  });
});

describe('UUT: Calculate fee', () => {
  const defaultFilledPrice = 5 as Price;
  const defaultFeeRates = { takerFeeRate: 1 as TakerFeeRate, makerFeeRate: 2 as MakerFeeRate };
  const defaultCurrencies = { capitalCurrency: 'USDT' as AssetName, assetCurrency: 'BTC' as AssetName };

  describe('[GIVEN] the order is a pending entry MARKET order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity and taker fee rate, with asset currency', () => {
        const order = mockPendingMarketOrder({ orderSide: 'ENTRY', quantity: 10 });
        const filledPrice = defaultFilledPrice;
        const feeRates = { ...defaultFeeRates, takerFeeRate: 5 as TakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 0.5, currency: currencies.assetCurrency });
      });
    });
  });

  describe('[GIVEN] the order is a pending exit MARKET order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity, price, and taker fee rate, with capital currency', () => {
        const order = mockPendingMarketOrder({ orderSide: 'EXIT', quantity: 10 });
        const filledPrice = 10 as Price;
        const feeRates = { ...defaultFeeRates, takerFeeRate: 5 as TakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 5, currency: currencies.capitalCurrency });
      });
    });
  });

  describe('[GIVEN] the order is a pending entry LIMIT order [AND] the limit price is less than the filled price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity and maker fee rate, with asset currency', () => {
        const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
        const filledPrice = 6 as Price;
        const feeRates = { ...defaultFeeRates, makerFeeRate: 3 as MakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 0.3, currency: currencies.assetCurrency });
      });
    });
  });
  describe('[GIVEN] the order is a pending entry LIMIT order [AND] the limit price is greater than or equal to the filled price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity and taker fee rate, with asset currency', () => {
        const order = mockPendingLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
        const filledPrice = 4 as Price;
        const feeRates = { ...defaultFeeRates, takerFeeRate: 5 as TakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 0.5, currency: currencies.assetCurrency });
      });
    });
  });

  describe('[GIVEN] the order is a opening entry LIMIT order [AND] the limit price is less than the filled price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity and maker fee rate, with asset currency', () => {
        const order = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
        const filledPrice = 6 as Price;
        const feeRates = { ...defaultFeeRates, makerFeeRate: 3 as MakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 0.3, currency: currencies.assetCurrency });
      });
    });
  });
  describe('[GIVEN] the order is a opening entry LIMIT order [AND] the limit price is greater than or equal to the filled price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity and taker fee rate, with asset currency', () => {
        const order = mockOpeningLimitOrder({ orderSide: 'ENTRY', quantity: 10, limitPrice: 5 });
        const filledPrice = 4 as Price;
        const feeRates = { ...defaultFeeRates, takerFeeRate: 5 as TakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 0.5, currency: currencies.assetCurrency });
      });
    });
  });

  describe('[GIVEN] the order is a pending exit LIMIT order [AND] the limit price is less than the filled price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity, price, and taker fee rate, with capital currency', () => {
        const order = mockPendingLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 5 });
        const filledPrice = 6 as Price;
        const feeRates = { ...defaultFeeRates, takerFeeRate: 5 as TakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 3, currency: currencies.capitalCurrency });
      });
    });
  });
  describe('[GIVEN] the order is a pending exit LIMIT order [AND] the limit price is greater than or equal to the filled price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity, price, and maker fee rate, with capital currency', () => {
        const order = mockPendingLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 5 });
        const filledPrice = 4 as Price;
        const feeRates = { ...defaultFeeRates, makerFeeRate: 3 as MakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 1.2, currency: currencies.capitalCurrency });
      });
    });
  });

  describe('[GIVEN] the order is a opening exit LIMIT order [AND] the limit price is less than the filled price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity, price, and taker fee rate, with capital currency', () => {
        const order = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 5 });
        const filledPrice = 6 as Price;
        const feeRates = { ...defaultFeeRates, takerFeeRate: 5 as TakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 3, currency: currencies.capitalCurrency });
      });
    });
  });
  describe('[GIVEN] the order is a opening exit LIMIT order [AND] the limit price is greater than or equal to the filled price', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity, price, and maker fee rate, with capital currency', () => {
        const order = mockOpeningLimitOrder({ orderSide: 'EXIT', quantity: 10, limitPrice: 5 });
        const filledPrice = 4 as Price;
        const feeRates = { ...defaultFeeRates, makerFeeRate: 3 as MakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 1.2, currency: currencies.capitalCurrency });
      });
    });
  });

  describe('[GIVEN] the order is an opening entry STOP_MARKET order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity and taker fee rate, with asset currency', () => {
        const order = mockOpeningStopMarketOrder({ orderSide: 'ENTRY', quantity: 5 });
        const filledPrice = defaultFilledPrice;
        const feeRates = { ...defaultFeeRates, takerFeeRate: 2 as TakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 0.1, currency: currencies.assetCurrency });
      });
    });
  });

  describe('[GIVEN] the order is an opening exit STOP_MARKET order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity, price, and taker fee rate, with capital currency', () => {
        const order = mockOpeningStopMarketOrder({ orderSide: 'EXIT', quantity: 10 });
        const filledPrice = 10 as Price;
        const feeRates = { ...defaultFeeRates, takerFeeRate: 5 as TakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 5, currency: currencies.capitalCurrency });
      });
    });
  });

  describe('[GIVEN] the order is an opening entry STOP_LIMIT order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity and maker fee rate, and asset currency', () => {
        const order = mockOpeningStopLimitOrder({ orderSide: 'ENTRY', quantity: 5 });
        const filledPrice = defaultFilledPrice;
        const feeRates = { ...defaultFeeRates, makerFeeRate: 2 as MakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 0.1, currency: currencies.assetCurrency });
      });
    });
  });

  describe('[GIVEN] the order is an opening exit STOP_LIMIT order', () => {
    describe('[WHEN] calculate fee', () => {
      it('[THEN] it will return fee amount based on quantity, price, and maker fee rate, and capital currency', () => {
        const order = mockOpeningStopLimitOrder({ orderSide: 'EXIT', quantity: 10 });
        const filledPrice = 10 as Price;
        const feeRates = { ...defaultFeeRates, makerFeeRate: 5 as MakerFeeRate };
        const currencies = defaultCurrencies;

        const result = calculateFee(order, filledPrice, feeRates, currencies);

        expect(result).toEqual({ amount: 5, currency: currencies.capitalCurrency });
      });
    });
  });
});
