import { mockFilledMarketOrder } from '#test-utils/features/shared/order.js';
import { mockClosedTrade, mockOpeningTrade } from '#test-utils/features/shared/trades.js';

import { OpeningTrade } from '../trade.js';
import { buildTradesModules } from './trades.js';

describe('UUT: Build a trades module', () => {
  const anyOpeningTrades: OpeningTrade[] = [];

  describe('[WHEN] build a trades module', () => {
    it('[THEN] it will return module with opening and closed trades list equal to the given lists', () => {
      const openingTrade = mockOpeningTrade(
        mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 10, filledPrice: 5, fee: { amount: 0 } }),
      );
      const openingTrades = [openingTrade];
      const closedTrade = mockClosedTrade(
        mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 1, filledPrice: 1, fee: { amount: 0 } }),
        mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 1, filledPrice: 2, fee: { amount: 0 } }),
      );
      const closedTrades = [closedTrade];

      const result = buildTradesModules(openingTrades, closedTrades);

      expect(result).toEqual(expect.objectContaining({ openingTrades, closedTrades }));
    });
  });

  describe('[GIVEN] the closed trades list contains trade that has net return equal to 0', () => {
    describe('[WHEN] build a trades module with that list', () => {
      it('[THEN] it will return module with a even trades list that contains the 0 net return trade', () => {
        const evenTrade = mockClosedTrade(
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 1, filledPrice: 1, fee: { amount: 0 } }),
          mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 1, filledPrice: 1, fee: { amount: 0 } }),
        );
        const openingTrades = anyOpeningTrades;
        const closedTrades = [evenTrade];

        const result = buildTradesModules(openingTrades, closedTrades);

        expect(result).toEqual(
          expect.objectContaining({ evenTrades: [evenTrade], winTrades: [], lossTrades: [] }),
        );
      });
    });
  });
  describe('[GIVEN] the closed trades list contains trade that has net return greater than 0', () => {
    describe('[WHEN] build a trades module with that list', () => {
      it('[THEN] it will return module with a win trades list that contains the trade', () => {
        const winTrade = mockClosedTrade(
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 1, filledPrice: 1, fee: { amount: 0 } }),
          mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 1, filledPrice: 2, fee: { amount: 0 } }),
        );
        const openingTrades = anyOpeningTrades;
        const closedTrades = [winTrade];

        const result = buildTradesModules(openingTrades, closedTrades);

        expect(result).toEqual(
          expect.objectContaining({ evenTrades: [], winTrades: [winTrade], lossTrades: [] }),
        );
      });
    });
  });
  describe('[GIVEN] the closed trades list contains trade that has net return less than 0', () => {
    describe('[WHEN] build a trades module with that list', () => {
      it('[THEN] it will return module with a loss trades list that contains the trade', () => {
        const lossTrade = mockClosedTrade(
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 1, filledPrice: 1, fee: { amount: 0 } }),
          mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 1, filledPrice: 0.5, fee: { amount: 0 } }),
        );
        const openingTrades = anyOpeningTrades;
        const closedTrades = [lossTrade];

        const result = buildTradesModules(openingTrades, closedTrades);

        expect(result).toEqual(
          expect.objectContaining({ evenTrades: [], winTrades: [], lossTrades: [lossTrade] }),
        );
      });
    });
  });
});
