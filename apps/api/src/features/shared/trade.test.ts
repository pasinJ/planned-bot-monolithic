import { dissoc } from 'ramda';

import { executeIo } from '#shared/utils/fp.js';
import { mockKline } from '#test-utils/features/shared/kline.js';
import { mockFilledMarketOrder } from '#test-utils/features/shared/order.js';
import { mockOpeningTrade } from '#test-utils/features/shared/trades.js';

import { Price } from './kline.js';
import {
  TradeDrawdown,
  TradeId,
  TradeRunup,
  closeTrades,
  createFullOpeningTrade,
  createPartialOpeningTrade,
  updateOpeningTradeStats,
} from './trade.js';

describe('UUT: Create a full opening trade', () => {
  describe('[WHEN] create a full opening trade', () => {
    it('[THEN] it will return a opening trade', () => {
      const tradeId = 'EQRzWUb22K' as TradeId;
      const filledEntryOrder = mockFilledMarketOrder({
        orderSide: 'ENTRY',
        quantity: 10,
        filledPrice: 5,
        fee: { amount: 2 },
      });

      const result = createFullOpeningTrade(tradeId, filledEntryOrder);

      expect(result).toEqual({
        id: tradeId,
        entryOrder: filledEntryOrder,
        tradeQuantity: 8,
        maxDrawdown: 0,
        maxPrice: 5,
        maxRunup: 0,
        minPrice: 5,
        unrealizedReturn: 0,
      });
    });
  });
});

describe('UUT: Create a partial opening trade', () => {
  const anyTradeId = 'EtsDuXQzJa' as TradeId;
  const entryOrder = mockFilledMarketOrder({
    orderSide: 'ENTRY',
    quantity: 10.1,
    fee: { amount: 0.1 },
    filledPrice: 5,
  });
  const anyOpeningTrade = {
    ...createFullOpeningTrade('xq-n_bG_KY' as TradeId, entryOrder),
    maxPrice: 10 as Price,
    maxRunup: 100 as TradeRunup,
  };

  describe('[GIVEN] the partial trade quantity is between 0 and opening trade quantity', () => {
    describe('[WHEN] create a partial opening trade', () => {
      it('[THEN] it will return a opening trade', () => {
        const tradeId = 'rxZPVIYTTN' as TradeId;
        const entryOrder = mockFilledMarketOrder({
          orderSide: 'ENTRY',
          quantity: 10.1,
          fee: { amount: 0.1 },
          filledPrice: 5,
        });
        const openingTrade = {
          ...createFullOpeningTrade('xq-n_bG_KY' as TradeId, entryOrder),
          maxPrice: 10 as Price,
          maxRunup: 100 as TradeRunup,
        };
        const tradeQuantity = 5;

        const result = createPartialOpeningTrade(tradeId, tradeQuantity, openingTrade);

        expect(result).toEqualRight({
          ...openingTrade,
          id: tradeId,
          tradeQuantity,
          maxDrawdown: 0,
          maxRunup: 25,
          unrealizedReturn: 0,
        });
      });
    });
  });

  describe('[GIVEN] the partial trade quantity is less than or equal to 0', () => {
    describe('[WHEN] create a partial opening trade', () => {
      it('[THEN] it will return a opening trade', () => {
        const tradeId = anyTradeId;
        const openingTrade = anyOpeningTrade;
        const tradeQuantity = 0;

        const result = createPartialOpeningTrade(tradeId, tradeQuantity, openingTrade);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });

  describe('[GIVEN] the partial trade quantity is greater than or equal to opening trade quantity', () => {
    describe('[WHEN] create a partial opening trade', () => {
      it('[THEN] it will return a opening trade', () => {
        const tradeId = anyTradeId;
        const entryOrder = mockFilledMarketOrder({
          orderSide: 'ENTRY',
          quantity: 10.1,
          fee: { amount: 0.1 },
          filledPrice: 5,
        });
        const openingTrade = createFullOpeningTrade('kc0xzXUFAU' as TradeId, entryOrder);
        const tradeQuantity = 11;

        const result = createPartialOpeningTrade(tradeId, tradeQuantity, openingTrade);

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Close trades', () => {
  describe('[GIVEN] there is a opening trade with trade quantity equals to the exit order quantity', () => {
    const deps = { generateTradeId: () => '4-6OhvxTp7' as TradeId };
    const entryOrder = mockFilledMarketOrder({
      orderSide: 'ENTRY',
      quantity: 16,
      filledPrice: 2,
      fee: { amount: 1 },
    });
    const openingTrade = createFullOpeningTrade('q-gK0uCTO3' as TradeId, entryOrder);
    const openingTrades = [openingTrade];
    const exitOrder = mockFilledMarketOrder({
      orderSide: 'EXIT',
      quantity: 15,
      filledPrice: 10,
      fee: { amount: 10 },
    });

    describe('[WHEN] close trades', () => {
      it('[THEN] it will return Right of closed trades list with closed trade of the opening trade with mathcing trade quantity', () => {
        const result = executeIo(closeTrades(deps, openingTrades, exitOrder));

        const expectedClosedTrade = {
          ...dissoc('unrealizedReturn', openingTrade),
          exitOrder,
          maxRunup: 120,
          maxPrice: exitOrder.filledPrice,
          netReturn: 108,
        };
        expect(result).toSubsetEqualRight({ closedTrades: expect.arrayContaining([expectedClosedTrade]) });
      });
      it('[THEN] it will return Right of opening trades list without the opening trade with mathcing trade quantity', () => {
        const result = executeIo(closeTrades(deps, openingTrades, exitOrder));

        expect(result).toSubsetEqualRight({ openingTrades: expect.not.arrayContaining([openingTrade]) });
      });
    });
  });

  describe('[GIVEN] there is a opening trade with trade quantity more than the exit order quantity', () => {
    const remainTradeId = '4-6OhvxTp7' as TradeId;
    const closedTradeId = 'ISK5oj3tn4' as TradeId;
    let deps: { generateTradeId: () => TradeId };
    const entryOrder = mockFilledMarketOrder({
      orderSide: 'ENTRY',
      quantity: 20.2,
      filledPrice: 5,
      fee: { amount: 0.2 },
    });
    const openingTrade = createFullOpeningTrade('uHqWJ3m7xt' as TradeId, entryOrder);
    const openingTrades = [openingTrade];
    const exitOrder = mockFilledMarketOrder({
      orderSide: 'EXIT',
      quantity: 10,
      filledPrice: 10,
      fee: { amount: 1 },
    });

    beforeEach(() => {
      deps = {
        generateTradeId: jest.fn().mockReturnValueOnce(remainTradeId).mockReturnValueOnce(closedTradeId),
      };
    });

    describe('[WHEN] close trades', () => {
      it('[THEN] it will return Right of closed trades list with closed trade that has trade quantity equals to the exit order', () => {
        const result = executeIo(closeTrades(deps, openingTrades, exitOrder));

        const expectedClosedTrade = {
          ...dissoc('unrealizedReturn', openingTrade),
          id: closedTradeId,
          tradeQuantity: 10,
          exitOrder,
          maxPrice: 10,
          maxRunup: 50,
          netReturn: 48.5,
        };
        expect(result).toSubsetEqualRight({
          closedTrades: expect.arrayContaining([expectedClosedTrade]),
        });
      });
      it('[THEN] it will return Right of opening trades list with a new opening trade that has trade quantity equals to the remaining opening trade quantity', () => {
        const result = executeIo(closeTrades(deps, openingTrades, exitOrder));

        expect(result).toSubsetEqualRight({
          openingTrades: expect.arrayContaining([{ ...openingTrade, id: remainTradeId, tradeQuantity: 10 }]),
        });
      });
    });
  });

  describe('[GIVEN] there are 2 opening trades [AND] sum of trade quantity equals to the exit order quantity', () => {
    const tradeId = '4-6OhvxTp7' as TradeId;
    const deps = { generateTradeId: () => tradeId };
    const entryOrder1 = mockFilledMarketOrder({
      orderSide: 'ENTRY',
      quantity: 10.2,
      filledPrice: 5,
      fee: { amount: 0.2 },
    });
    const openingTrade1 = createFullOpeningTrade('5qsKFsWUx3' as TradeId, entryOrder1);
    const entryOrder2 = mockFilledMarketOrder({
      orderSide: 'ENTRY',
      quantity: 5.1,
      filledPrice: 6,
      fee: { amount: 0.1 },
    });
    const openingTrade2 = createFullOpeningTrade('fwF1qm1DhT' as TradeId, entryOrder2);
    const openingTrades = [openingTrade1, openingTrade2];
    const exitOrder = mockFilledMarketOrder({
      orderSide: 'EXIT',
      quantity: 15,
      filledPrice: 10,
      fee: { amount: 0.1 },
    });

    describe('[WHEN] close trades', () => {
      it('[THEN] it will return Right of closed trades list with 2 closed trades of those opening trades', () => {
        const result = executeIo(closeTrades(deps, openingTrades, exitOrder));

        expect(result).toSubsetEqualRight({
          closedTrades: expect.arrayContaining([
            {
              ...dissoc('unrealizedReturn', openingTrade1),
              exitOrder,
              maxPrice: 10,
              maxRunup: 50,
              netReturn: 48.93333333,
            },
            {
              ...dissoc('unrealizedReturn', openingTrade2),
              exitOrder,
              maxPrice: 10,
              maxRunup: 20,
              netReturn: 19.36666667,
            },
          ]),
        });
      });
      it('[THEN] it will return Right of opening trades list without those opening trades', () => {
        const result = executeIo(closeTrades(deps, openingTrades, exitOrder));

        expect(result).toSubsetEqualRight({
          openingTrades: expect.not.arrayContaining([openingTrade1, openingTrade2]),
        });
      });
    });
  });

  describe('[GIVEN] there are not enough opening trades to fulfill the exit order quantity', () => {
    describe('[WHEN] close trades', () => {
      it('[THEN] it will return Left of string', () => {
        const deps = { generateTradeId: () => '4-6OhvxTp7' as TradeId };
        const openingTrade1 = createFullOpeningTrade(
          '0-KWVhc-n8' as TradeId,
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 2 }),
        );
        const openingTrade2 = createFullOpeningTrade(
          '0nrvSBmo1z' as TradeId,
          mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 5 }),
        );
        const openingTrades = [openingTrade1, openingTrade2];
        const exitOrder = mockFilledMarketOrder({ orderSide: 'EXIT', quantity: 15 });

        const result = executeIo(closeTrades(deps, openingTrades, exitOrder));

        expect(result).toEqualLeft(expect.toBeString());
      });
    });
  });
});

describe('UUT: Update opening trade stats', () => {
  describe('[WHEN] update opening trade stats', () => {
    it('[THEN] it will return opening trade with unrealized return property based on closed price', () => {
      const openingTrade = mockOpeningTrade(
        mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 1, filledPrice: 5, fee: { amount: 0 } }),
      );
      const kline = mockKline({ close: 10 });

      const result = updateOpeningTradeStats(openingTrade, kline);

      expect(result).toHaveProperty('unrealizedReturn', 5);
    });
  });

  describe('[GIVEN] high price of the current kline is greater than max price of the trade', () => {
    const openingTrade = {
      ...mockOpeningTrade(
        mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 1, filledPrice: 5, fee: { amount: 0 } }),
      ),
      maxPrice: 10 as Price,
      maxRunup: 5 as TradeRunup,
    };
    const kline = mockKline({ high: 15 });

    describe('[WHEN] update opening trade stats', () => {
      it('[THEN] it will return opening trade with max price property equals to the high price', () => {
        const result = updateOpeningTradeStats(openingTrade, kline);

        expect(result).toHaveProperty('maxPrice', kline.high);
      });
      it('[THEN] it will return opening trade with updated max runup property', () => {
        const result = updateOpeningTradeStats(openingTrade, kline);

        expect(result).toHaveProperty('maxRunup', 10);
      });
    });
  });
  describe('[GIVEN] high price of the current kline is less than or equal to max price of the trade', () => {
    const openingTrade = {
      ...mockOpeningTrade(
        mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 1, filledPrice: 5, fee: { amount: 0 } }),
      ),
      maxPrice: 10 as Price,
      maxRunup: 5 as TradeRunup,
    };
    const kline = mockKline({ high: 8 });

    describe('[WHEN] update opening trade stats', () => {
      it('[THEN] it will return opening trade with unchanged max price property', () => {
        const result = updateOpeningTradeStats(openingTrade, kline);

        expect(result).toHaveProperty('maxPrice', openingTrade.maxPrice);
      });
      it('[THEN] it will return opening trade with unchanged max runup property', () => {
        const result = updateOpeningTradeStats(openingTrade, kline);

        expect(result).toHaveProperty('maxRunup', openingTrade.maxRunup);
      });
    });
  });

  describe('[GIVEN] low price of the current kline is less than min price of the trade', () => {
    const openingTrade = {
      ...mockOpeningTrade(
        mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 1, filledPrice: 5, fee: { amount: 0 } }),
      ),
      minPrice: 3 as Price,
      maxDrawdown: -2 as TradeDrawdown,
    };
    const kline = mockKline({ low: 1 });

    describe('[WHEN] update opening trade stats', () => {
      it('[THEN] it will return opening trade with min price property equals to the low price', () => {
        const result = updateOpeningTradeStats(openingTrade, kline);

        expect(result).toHaveProperty('minPrice', kline.low);
      });
      it('[THEN] it will return opening trade with updated max drawdown property', () => {
        const result = updateOpeningTradeStats(openingTrade, kline);

        expect(result).toHaveProperty('maxDrawdown', -4);
      });
    });
  });
  describe('[GIVEN] low price of the current kline is greater than or equal to min price of the trade', () => {
    const openingTrade = {
      ...mockOpeningTrade(
        mockFilledMarketOrder({ orderSide: 'ENTRY', quantity: 1, filledPrice: 5, fee: { amount: 0 } }),
      ),
      minPrice: 3 as Price,
      maxDrawdown: -2 as TradeDrawdown,
    };
    const kline = mockKline({ low: 7 });

    describe('[WHEN] update opening trade stats', () => {
      it('[THEN] it will return opening trade with unchanged min price property', () => {
        const result = updateOpeningTradeStats(openingTrade, kline);

        expect(result).toHaveProperty('minPrice', openingTrade.minPrice);
      });
      it('[THEN] it will return opening trade with unchanged max drawdown property', () => {
        const result = updateOpeningTradeStats(openingTrade, kline);

        expect(result).toHaveProperty('maxDrawdown', openingTrade.maxDrawdown);
      });
    });
  });
});
