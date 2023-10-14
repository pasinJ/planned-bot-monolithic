import { mockKline } from '#test-utils/features/shared/kline.js';
import { mockFilledMarketOrder } from '#test-utils/features/shared/order.js';

import { InitialCapital } from './strategy.js';
import { calculateBuyAndHoldReturn } from './strategyPerformance.js';

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
