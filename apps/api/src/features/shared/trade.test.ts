import { mockFilledMarketOrder } from '#test-utils/features/shared/order.js';
import { mockOpeningTrade } from '#test-utils/features/shared/trades.js';

import { TradeId, closeTrades, createOpeningTrade } from './trade.js';

describe('UUT: Create a opening trade', () => {
  describe('[WHEN] create a opening trade', () => {
    it('[THEN] it will return a opening trade', () => {
      const tradeId = 'EQRzWUb22K' as TradeId;
      const filledEntryOrder = mockFilledMarketOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        fee: { amount: 2 },
      });

      const result = createOpeningTrade(tradeId, filledEntryOrder);

      expect(result).toEqual({
        id: tradeId,
        entryOrder: filledEntryOrder,
        tradeQuantity: 8,
        maxDrawdown: 0,
        maxRunup: 0,
      });
    });
  });
});

describe('UUT: Close trades', () => {
  describe('[GIVEN] there is a opening trade with trade quantity equals to the exit order quantity', () => {
    const entryOrder = mockFilledMarketOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      filledPrice: 5.1,
      fee: { amount: 0.01 },
    });
    const openingTrade = mockOpeningTrade({ tradeQuantity: 9.99, entryOrder });
    const openingTrades = [openingTrade];
    const exitOrder = mockFilledMarketOrder({
      orderSide: 'EXIT',
      quantity: 9.99,
      filledPrice: 10,
      fee: { amount: 0.999 },
    });

    describe('[WHEN] close trades', () => {
      it('[THEN] it will return Right of closed trades list with closed trade of the opening trade with mathcing trade quantity', () => {
        const result = closeTrades(openingTrades, exitOrder);

        expect(result).toSubsetEqualRight({
          closedTrades: expect.arrayContaining([{ ...openingTrade, exitOrder, netReturn: 47.901 }]),
        });
      });
      it('[THEN] it will return Right of opening trades list without the opening trade with mathcing trade quantity', () => {
        const result = closeTrades(openingTrades, exitOrder);

        expect(result).toSubsetEqualRight({ openingTrades: expect.not.arrayContaining([openingTrade]) });
      });
    });
  });

  describe('[GIVEN] there is a opening trade with trade quantity more than the exit order quantity', () => {
    const entryOrder = mockFilledMarketOrder({
      orderSide: 'ENTRY',
      quantity: 20,
      filledPrice: 5,
      fee: { amount: 0.2 },
    });
    const openingTrade = mockOpeningTrade({ tradeQuantity: 19.8, entryOrder });
    const openingTrades = [openingTrade];
    const exitOrder = mockFilledMarketOrder({
      orderSide: 'EXIT',
      quantity: 9.9,
      filledPrice: 10,
      fee: { amount: 0.99 },
    });

    describe('[WHEN] close trades', () => {
      it('[THEN] it will return Right of closed trades list with closed trade that has trade quantity equals to the exit order', () => {
        const result = closeTrades(openingTrades, exitOrder);

        expect(result).toSubsetEqualRight({
          closedTrades: expect.arrayContaining([
            { ...openingTrade, tradeQuantity: 9.9, exitOrder, netReturn: 48.01 },
          ]),
        });
      });
      it('[THEN] it will return Right of opening trades list with a new opening trade that has trade quantity equals to the difference between opening trade quantity and the exit order quantity', () => {
        const result = closeTrades(openingTrades, exitOrder);

        expect(result).toSubsetEqualRight({
          openingTrades: expect.arrayContaining([{ ...openingTrade, tradeQuantity: 9.9 }]),
        });
      });
    });
  });

  describe('[GIVEN] there are 2 opening trades [AND] sum of trade quantity equals to the exit order quantity', () => {
    const entryOrder1 = mockFilledMarketOrder({
      orderSide: 'ENTRY',
      quantity: 10,
      filledPrice: 5,
      fee: { amount: 0.2 },
    });
    const openingTrade1 = mockOpeningTrade({ tradeQuantity: 9.8, entryOrder: entryOrder1 });
    const entryOrder2 = mockFilledMarketOrder({
      orderSide: 'ENTRY',
      quantity: 5,
      filledPrice: 6,
      fee: { amount: 0.1 },
    });
    const openingTrade2 = mockOpeningTrade({ tradeQuantity: 4.9, entryOrder: entryOrder2 });
    const openingTrades = [openingTrade1, openingTrade2];
    const exitOrder = mockFilledMarketOrder({
      orderSide: 'EXIT',
      quantity: 14.7,
      filledPrice: 10,
      fee: { amount: 0.1 },
    });

    describe('[WHEN] close trades', () => {
      it('[THEN] it will return Right of closed trades list with 2 closed trades of those opening trades', () => {
        const result = closeTrades(openingTrades, exitOrder);

        expect(result).toSubsetEqualRight({
          closedTrades: expect.arrayContaining([
            { ...openingTrade1, exitOrder, netReturn: 47.93333333 },
            { ...openingTrade2, exitOrder, netReturn: 18.96666667 },
          ]),
        });
      });
      it('[THEN] it will return Right of opening trades list without those opening trades', () => {
        const result = closeTrades(openingTrades, exitOrder);

        expect(result).toSubsetEqualRight({
          openingTrades: expect.not.arrayContaining([openingTrade1, openingTrade2]),
        });
      });
    });
  });

  describe('[GIVEN] there are not enough opening trades to fulfill the exit order quantity', () => {
    describe('[WHEN] close trades', () => {
      it('[THEN] it will return Left of string', () => {
        const openingTrade1 = mockOpeningTrade({
          tradeQuantity: 2,
          entryOrder: mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 2 }),
        });
        const openingTrade2 = mockOpeningTrade({
          tradeQuantity: 5,
          entryOrder: mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 5 }),
        });
        const openingTrades = [openingTrade1, openingTrade2];
        const exitOrder = mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 15 });

        const result = closeTrades(openingTrades, exitOrder);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});
