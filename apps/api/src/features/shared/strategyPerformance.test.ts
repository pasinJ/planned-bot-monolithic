import { mockKline } from '#test-utils/features/shared/kline.js';
import { mockFilledMarketOrder } from '#test-utils/features/shared/order.js';

import { FilledOrder } from './order.js';
import { InitialCapital } from './strategy.js';
import { Return } from './strategyExecutorModules/strategy.js';
import {
  calculateBuyAndHoldReturn,
  calculateRateOfInvestment,
  getTotalTradeVolume,
} from './strategyPerformance.js';

describe('UUT: Calculate buy and hold return', () => {
  describe('[GIVEN] there is no filled entry order', () => {
    describe('[WHEN] calculate buy and hold return', () => {
      it('[THEN] it will return 0', () => {
        const initialCapital = 1000 as InitialCapital;
        const firstEntryOrder = undefined;
        const lastKline = mockKline();

        const result = calculateBuyAndHoldReturn(initialCapital, firstEntryOrder, lastKline);

        expect(result).toBe(0);
      });
    });
  });
  describe('[GIVEN] there is a filled entry order', () => {
    describe('[WHEN] calculate buy and hold return', () => {
      it('[THEN] it will return value that calculated as if the whole initial capital were used to entry when the first trade is entered, and the position was held until the last kline', () => {
        const initialCapital = 1000 as InitialCapital;
        const firstEntryOrder = mockFilledMarketOrder({
          orderSide: 'ENTRY',
          quantity: 10,
          filledPrice: 10,
          fee: { amount: 0.1 },
        });
        const lastKline = mockKline({ close: 30 });

        const result = calculateBuyAndHoldReturn(initialCapital, firstEntryOrder, lastKline);

        expect(result).toBe(1980);
      });
    });
  });
});

describe('UUT: Calculate rate of investment', () => {
  describe('[WHEN] calculate rate of investment', () => {
    it('[THEN] it will return correct rate of investment', () => {
      const initialCapital = 100 as InitialCapital;
      const netReturn = 10 as Return;

      const result = calculateRateOfInvestment(initialCapital, netReturn);

      expect(result).toBe(10);
    });
  });
});

describe('UUT: Get total trade volume', () => {
  describe('[GIVEN] there is no filled order', () => {
    describe('[WHEN] get total trade volume', () => {
      it('[THEN] it will reutrn 0', () => {
        const filledOrders = [] as FilledOrder[];

        const result = getTotalTradeVolume(filledOrders);

        expect(result).toBe(0);
      });
    });
  });
  describe('[GIVEN] there is no filled entry order in the filled orders list', () => {
    describe('[WHEN] get total trade volume', () => {
      it('[THEN] it will reutrn 0', () => {
        const filledOrders = [mockFilledMarketOrder({ orderSide: 'EXIT' })] as FilledOrder[];

        const result = getTotalTradeVolume(filledOrders);

        expect(result).toBe(0);
      });
    });
  });
  describe('[GIVEN] there are filled entry orders in the filled orders list', () => {
    describe('[WHEN] get total trade volume', () => {
      it('[THEN] it will reutrn sum of quantity of all entry order', () => {
        const filledOrders = [
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 5 }),
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 1 }),
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 2 }),
        ] as FilledOrder[];

        const result = getTotalTradeVolume(filledOrders);

        expect(result).toBe(8);
      });
    });
  });
});
