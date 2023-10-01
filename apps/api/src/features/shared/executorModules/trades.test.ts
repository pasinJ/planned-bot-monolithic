import { executeIo } from '#shared/utils/fp.js';
import { mockFilledMarketOrder } from '#test-utils/features/shared/order.js';
import { mockOpeningTrade, randomTradeId } from '#test-utils/features/shared/trades.js';

import { closeTrades, createOpeningTrade } from './trades.js';

describe('UUT: Create opening trade', () => {
  describe('[WHEN] create opening trade', () => {
    it('[THEN] it will return a opening trade', () => {
      const tradeId = randomTradeId();
      const deps = { generateTradeId: () => tradeId };
      const order = mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 10, fee: { amount: 2 } } as const);

      const result = executeIo(createOpeningTrade(deps, order));

      expect(result).toEqual({
        id: tradeId,
        entryOrder: order,
        tradeQuantity: 8,
        maxDrawdown: 0,
        maxRunup: 0,
      });
    });
  });
});

describe('UUT: Close trades', () => {
  describe('[GIVEN] there is a opening trade with trade quantity equals to the exit order quantity', () => {
    function setup() {
      const openingTrade = mockOpeningTrade({ tradeQuantity: 10 });
      const exitOrder = mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 10 } as const);

      return { openingTrade, exitOrder, trades: { openingTrades: [openingTrade], closedTrades: [] } };
    }

    describe('[WHEN] close trade', () => {
      it('[THEN] it will return Right of opening trades list without that mathcing quantity trade', () => {
        const { exitOrder, trades } = setup();

        const result = closeTrades(trades, exitOrder);

        expect(result).toSubsetEqualRight({ openingTrades: [] });
      });
      it('[THEN] it will return Right of closed trades list with that mathcing quantity trade', () => {
        const { openingTrade, exitOrder, trades } = setup();

        const result = closeTrades(trades, exitOrder);

        expect(result).toSubsetEqualRight({ closedTrades: [{ ...openingTrade, exitOrder }] });
      });
    });
  });
  describe('[GIVEN] there is a opening trade with trade quantity more than the exit order quantity', () => {
    function setup() {
      const openingTrade = mockOpeningTrade({ tradeQuantity: 15 });
      const exitOrder = mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 10 } as const);

      return { openingTrade, exitOrder, trades: { openingTrades: [openingTrade], closedTrades: [] } };
    }

    describe('[WHEN] close trade', () => {
      it('[THEN] it will return Right of opening trades list with a new opening trade that has trade quantity equals to the difference between opening trade quantity and the exit order quantity', () => {
        const { openingTrade, exitOrder, trades } = setup();

        const result = closeTrades(trades, exitOrder);

        expect(result).toSubsetEqualRight({ openingTrades: [{ ...openingTrade, tradeQuantity: 5 }] });
      });
      it('[THEN] it will return Right of closed trades list with a closed trade that has trade quantity equals to the exit order', () => {
        const { openingTrade, exitOrder, trades } = setup();

        const result = closeTrades(trades, exitOrder);

        expect(result).toSubsetEqualRight({
          closedTrades: [{ ...openingTrade, tradeQuantity: 10, exitOrder }],
        });
      });
    });
  });
  describe('[GIVEN] there are opening trades with trade quantity less than the exit order quantity', () => {
    function setup() {
      const openingTrade1 = mockOpeningTrade({ tradeQuantity: 2 });
      const openingTrade2 = mockOpeningTrade({ tradeQuantity: 8 });
      const exitOrder = mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 10 } as const);

      return {
        openingTrade1,
        openingTrade2,
        exitOrder,
        trades: { openingTrades: [openingTrade1, openingTrade2], closedTrades: [] },
      };
    }

    describe('[WHEN] close trade', () => {
      it('[THEN] it will return Right of opening trades list without that mathcing quantity trade', () => {
        const { exitOrder, trades } = setup();

        const result = closeTrades(trades, exitOrder);

        expect(result).toSubsetEqualRight({ openingTrades: [] });
      });
      it('[THEN] it will return Right of closed trades list with a closed trade that has trade quantity equals to the exit order', () => {
        const { openingTrade1, openingTrade2, exitOrder, trades } = setup();

        const result = closeTrades(trades, exitOrder);

        expect(result).toSubsetEqualRight({
          closedTrades: [
            { ...openingTrade1, exitOrder },
            { ...openingTrade2, exitOrder },
          ],
        });
      });
    });
  });
  describe('[GIVEN] there are not enough opening trades to fulfill the exit order quantity', () => {
    describe('[WHEN] close trade', () => {
      it('[THEN] it will return Left of string', () => {
        const openingTrade1 = mockOpeningTrade({ tradeQuantity: 2 });
        const openingTrade2 = mockOpeningTrade({ tradeQuantity: 8 });
        const trades = { openingTrades: [openingTrade1, openingTrade2], closedTrades: [] };
        const exitOrder = mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 15 } as const);

        const result = closeTrades(trades, exitOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});
