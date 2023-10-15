import { mockKline } from '#test-utils/features/shared/kline.js';
import { mockFilledMarketOrder } from '#test-utils/features/shared/order.js';
import { mockClosedTrade } from '#test-utils/features/shared/trades.js';

import { FilledOrder } from './order.js';
import { InitialCapital } from './strategy.js';
import { Loss, Profit, Return } from './strategyExecutorModules/strategy.js';
import {
  calculateBuyAndHoldReturn,
  calculateProfitFactor,
  calculateReturnOfInvestment,
  calculateWinLossMetrics,
  getTotalTradeVolume,
} from './strategyPerformance.js';
import { ClosedTrade, NetReturn } from './trade.js';

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

describe('UUT: Calculate return of investment', () => {
  describe('[WHEN] calculate return of investment', () => {
    it('[THEN] it will return correct return of investment', () => {
      const initialCapital = 100 as InitialCapital;
      const netReturn = 10 as Return;

      const result = calculateReturnOfInvestment(initialCapital, netReturn);

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

describe('UUT: Calculate win/loss metrics', () => {
  const entryWithNoFeeBase = { orderSide: 'ENTRY', fee: { amount: 0 } } as const;
  const exitWithNoFeeBase = { orderSide: 'EXIT', fee: { amount: 0 } } as const;
  const winningTrade = mockClosedTrade(
    mockFilledMarketOrder({ ...entryWithNoFeeBase, quantity: 1, filledPrice: 3 }),
    mockFilledMarketOrder({ ...exitWithNoFeeBase, quantity: 1, filledPrice: 4 }),
  );
  const losingTrade = mockClosedTrade(
    mockFilledMarketOrder({ ...entryWithNoFeeBase, quantity: 1, filledPrice: 3 }),
    mockFilledMarketOrder({ ...exitWithNoFeeBase, quantity: 1, filledPrice: 2 }),
  );
  const evenTrade = mockClosedTrade(
    mockFilledMarketOrder({ ...entryWithNoFeeBase, quantity: 1, filledPrice: 3 }),
    mockFilledMarketOrder({ ...exitWithNoFeeBase, quantity: 1, filledPrice: 3 }),
  );

  describe('[GIVEN] the closed trade list is empty', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return correct metrics', () => {
        const closedTrades = [] as ClosedTrade[];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toEqual({
          numOfTotalTrades: 0,
          numOfWinningTrades: 0,
          numOfLosingTrades: 0,
          numOfEvenTrades: 0,
          winRate: 0,
          lossRate: 0,
          evenRate: 0,
          avgProfit: 0,
          avgLoss: 0,
          largestProfit: 0,
          largestLoss: 0,
        });
      });
    });
  });

  describe('[GIVEN] there are 3 trades in the closed trades list', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return number of total trades equal to 3', () => {
        const closedTrades = [winningTrade, losingTrade, evenTrade];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('numOfTotalTrades', 3);
      });
    });
  });
  describe('[GIVEN] there are 2 winning trades in the closed trades list', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return number of winning trades equal to 2', () => {
        const closedTrades = [winningTrade, winningTrade, losingTrade, evenTrade];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('numOfWinningTrades', 2);
      });
    });
  });
  describe('[GIVEN] there are 2 losing trades in the closed trades list', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return number of losing trades equal to 2', () => {
        const closedTrades = [winningTrade, losingTrade, losingTrade, evenTrade];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('numOfLosingTrades', 2);
      });
    });
  });
  describe('[GIVEN] there are 1 even trades in the closed trades list', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return number of even trades equal to 1', () => {
        const closedTrades = [winningTrade, losingTrade, evenTrade];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('numOfEvenTrades', 1);
      });
    });
  });

  describe('[GIVEN] there are 2 winning trades in the 5 closed trades list', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return win rate equal to 40', () => {
        const closedTrades = [winningTrade, winningTrade, losingTrade, evenTrade, evenTrade];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('winRate', 40);
      });
    });
  });
  describe('[GIVEN] there are 1 losing trades in the 5 closed trades list', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return loss rate equal to 20', () => {
        const closedTrades = [winningTrade, winningTrade, losingTrade, evenTrade, evenTrade];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('lossRate', 20);
      });
    });
  });
  describe('[GIVEN] there are 3 even trades in the 5 closed trades list', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return loss rate equal to 60', () => {
        const closedTrades = [winningTrade, losingTrade, evenTrade, evenTrade, evenTrade];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('evenRate', 60);
      });
    });
  });

  describe('[GIVEN] there are 2 winning trades with 10 and 20 net returns', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return average profit equal to 15', () => {
        const closedTrades = [
          { ...winningTrade, netReturn: 10 as NetReturn },
          { ...winningTrade, netReturn: 20 as NetReturn },
        ];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('avgProfit', 15);
      });
    });
  });
  describe('[GIVEN] there are 3 losing trades with -10, -20, and -30 net returns', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return average loss equal to -20', () => {
        const closedTrades = [
          { ...losingTrade, netReturn: -10 as NetReturn },
          { ...losingTrade, netReturn: -20 as NetReturn },
          { ...losingTrade, netReturn: -30 as NetReturn },
        ];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('avgLoss', -20);
      });
    });
  });

  describe('[GIVEN] there are 3 winning trades with 10, 20, and 30 net returns', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return largest profit equal to 30', () => {
        const closedTrades = [
          { ...winningTrade, netReturn: 20 as NetReturn },
          { ...winningTrade, netReturn: 30 as NetReturn },
          { ...winningTrade, netReturn: 10 as NetReturn },
        ];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('largestProfit', 30);
      });
    });
  });
  describe('[GIVEN] there are 3 losing trades with -5, -10, and -20 net returns', () => {
    describe('[WHEN] calculate win/loss metrics', () => {
      it('[THEN] it will return largest loss equal to -20', () => {
        const closedTrades = [
          { ...losingTrade, netReturn: -10 as NetReturn },
          { ...losingTrade, netReturn: -20 as NetReturn },
          { ...losingTrade, netReturn: -5 as NetReturn },
        ];

        const result = calculateWinLossMetrics(closedTrades);

        expect(result).toHaveProperty('largestLoss', -20);
      });
    });
  });
});

describe('UUT: Calculate profit factor', () => {
  describe('[WHEN] calculate profit factor', () => {
    it('[THEN] it will return correct profit factor', () => {
      const netProfit = 1 as Profit;
      const netLoss = 2 as Loss;

      const result = calculateProfitFactor(netProfit, netLoss);

      expect(result).toBe(0.5);
    });
  });
});
