import { setupServer } from 'msw/node';

import { exchangeNameEnum } from '#features/exchanges/exchange';
import { timeframeEnum } from '#features/klines/kline';
import { BaseAsset, SymbolName } from '#features/symbols/symbol';
import { createAxiosHttpClient } from '#infra/axiosHttpClient';
import { ValidDate } from '#shared/utils/date';
import { executeT } from '#shared/utils/fp';
import { TimezoneString } from '#shared/utils/string';
import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/btStrategies/btStrategy';
import { addRestRoute, createApiPath } from '#test-utils/msw';

import { BtExecutionId, btExecutionStatusEnum } from './btExecution';
import { BtStrategyId } from './btStrategy';
import { AddBtStrategyRequest, UpdateBtStrategyRequest, createBtStrategyRepo } from './btStrategy.repository';
import { isBtStrategyRepoError } from './btStrategy.repository.error';
import { API_ENDPOINTS } from './endpoints';

const httpClient = createAxiosHttpClient();
const btStrategyRepo = createBtStrategyRepo({ httpClient });
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UUT: Get backtesting strategies', () => {
  const { url, method } = API_ENDPOINTS.GET_BT_STRATEGIES;

  describe('[WHEN] get backtesting strategies', () => {
    it('[THEN] it will send a GET request to the server', async () => {
      let serverHasBeenCalled = false;
      server.use(
        addRestRoute(method, createApiPath(url), async (_, res, ctx) => {
          serverHasBeenCalled = true;
          return res(ctx.status(200), ctx.json([]));
        }),
      );

      await executeT(btStrategyRepo.getBtStrategies);

      expect(serverHasBeenCalled).toBe(true);
    });
  });

  describe('[GIVEN] the server responds successful response with a list of backtesting strategies', () => {
    describe('[WHEN] get backtesting strategies', () => {
      it('[THEN] it will return Right of the list of backtesting strategies', async () => {
        const strategies = generateArrayOf(mockBtStrategy, 3);
        server.use(
          addRestRoute(method, createApiPath(url), (_, res, ctx) =>
            res(ctx.status(200), ctx.json(strategies)),
          ),
        );

        const result = await executeT(btStrategyRepo.getBtStrategies);

        expect(result).toEqualRight(strategies);
      });
    });
  });

  describe('[GIVEN] the server responds HTTP error', () => {
    describe('[WHEN] get backtesting strategies', () => {
      it('[THEN] it will return Left of error', async () => {
        server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));

        const result = await executeT(btStrategyRepo.getBtStrategies);

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
      });
    });
  });
});

describe('UUT: Add backtesting strategy', () => {
  const { method, url } = API_ENDPOINTS.ADD_BT_STRATEGY;
  const request: AddBtStrategyRequest = {
    name: 'strategy name',
    exchange: exchangeNameEnum.BINANCE,
    symbol: 'BNBUSDT' as SymbolName,
    timeframe: timeframeEnum['15m'],
    maxNumKlines: 100,
    startTimestamp: new Date('2010-02-03') as ValidDate,
    endTimestamp: new Date('2010-02-04') as ValidDate,
    timezone: 'Asia/Bangkok' as TimezoneString,
    capitalCurrency: 'BNB' as BaseAsset,
    initialCapital: 100.1,
    takerFeeRate: 0.1,
    makerFeeRate: 0.1,
    body: 'console.log("Hi")',
  };

  describe('[WHEN] add backtesting strategy', () => {
    it('THEN it will send a request with given data to the server', async () => {
      let requestBody = {};
      server.use(
        addRestRoute(method, createApiPath(url), async (req, res, ctx) => {
          requestBody = await req.json();
          return res(ctx.status(201));
        }),
      );

      await executeT(btStrategyRepo.addBtStrategy(request));

      expect(requestBody).toEqual({
        name: 'strategy name',
        exchange: exchangeNameEnum.BINANCE,
        symbol: 'BNBUSDT',
        timeframe: '15m',
        maxNumKlines: 100,
        startTimestamp: '2010-02-03T00:00:00.000Z',
        endTimestamp: '2010-02-04T00:00:00.000Z',
        timezone: 'Asia/Bangkok',
        capitalCurrency: 'BNB',
        initialCapital: 100.1,
        takerFeeRate: 0.1,
        makerFeeRate: 0.1,
        body: 'console.log("Hi")',
      });
    });
  });

  describe('[GIVEN] the server responds successful response with ID and creation timestamp', () => {
    describe('[WHEN] add backtesting strategy', () => {
      it('[THEN] it will return Right of ID and creation timestamp', async () => {
        const newBtStrategyId = 'newId';
        const creationTime = new Date('2020-10-10');
        server.use(
          addRestRoute(method, createApiPath(url), (_, res, ctx) =>
            res(ctx.status(201), ctx.json({ id: newBtStrategyId, createdAt: creationTime })),
          ),
        );

        const result = await executeT(btStrategyRepo.addBtStrategy(request));

        expect(result).toEqualRight({ id: newBtStrategyId, createdAt: creationTime });
      });
    });
  });

  describe('[GIVEN] the server responds HTTP error', () => {
    describe('[WHEN] add backtesting strategy', () => {
      it('[THEN] it will return Left of error', async () => {
        server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));

        const result = await executeT(btStrategyRepo.addBtStrategy(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
      });
    });
  });
});

describe('UUT: Update backtesting strategy', () => {
  const { method, url: urlTemplate } = API_ENDPOINTS.UPDATE_BT_STRATEGY;
  const request: UpdateBtStrategyRequest = {
    id: 'existId' as BtStrategyId,
    name: 'strategy name',
    exchange: exchangeNameEnum.BINANCE,
    symbol: 'BNBUSDT' as SymbolName,
    timeframe: timeframeEnum['15m'],
    maxNumKlines: 100,
    startTimestamp: new Date('2010-02-03') as ValidDate,
    endTimestamp: new Date('2010-02-04') as ValidDate,
    timezone: 'Asia/Bangkok' as TimezoneString,
    capitalCurrency: 'BNB' as BaseAsset,
    initialCapital: 100.1,
    takerFeeRate: 0.1,
    makerFeeRate: 0.1,
    body: 'console.log("Hi")',
  };
  const url = urlTemplate.replace(':id', request.id);

  describe('[WHEN] update backtesting strategy', () => {
    it('THEN it will send a request with given data to the server', async () => {
      let requestBody = {};
      server.use(
        addRestRoute(method, createApiPath(url), async (req, res, ctx) => {
          requestBody = await req.json();
          return res(ctx.status(200));
        }),
      );

      await executeT(btStrategyRepo.updateBtStrategy(request));

      expect(requestBody).toEqual({
        name: 'strategy name',
        exchange: exchangeNameEnum.BINANCE,
        symbol: 'BNBUSDT',
        timeframe: '15m',
        maxNumKlines: 100,
        startTimestamp: '2010-02-03T00:00:00.000Z',
        endTimestamp: '2010-02-04T00:00:00.000Z',
        timezone: 'Asia/Bangkok',
        capitalCurrency: 'BNB',
        initialCapital: 100.1,
        takerFeeRate: 0.1,
        makerFeeRate: 0.1,
        body: 'console.log("Hi")',
      });
    });
  });

  describe('[GIVEN] the server responds successful response', () => {
    describe('[WHEN] update backtesting strategy', () => {
      it('[THEN] it will return Right of undefined', async () => {
        server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(200))));

        const result = await executeT(btStrategyRepo.updateBtStrategy(request));

        expect(result).toEqualRight(undefined);
      });
    });
  });

  describe('[GIVEN] the server responds HTTP error', () => {
    describe('[WHEN] update backtesting strategy', () => {
      it('[THEN] it will return Left of error', async () => {
        server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));

        const result = await executeT(btStrategyRepo.updateBtStrategy(request));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
      });
    });
  });
});

describe('UUT: Execute backtesting strategy', () => {
  const { method, url } = API_ENDPOINTS.EXECUTE_BT_STRATEGY;

  describe('[WHEN] execute backtesting strategy', () => {
    it('THEN it will send a request to the server', async () => {
      const btStrategyId = 'G100BRff4j' as BtStrategyId;
      const btExecutionId = 'htWiFAzgeV';
      const btExecutionCreation = new Date('2020-10-11');

      let serverHasBeenCalled = false;
      server.use(
        addRestRoute(method, createApiPath(url.replace(':id', btStrategyId)), (_, res, ctx) => {
          serverHasBeenCalled = true;
          return res(ctx.status(202), ctx.json({ id: btExecutionId, createdAt: btExecutionCreation }));
        }),
      );

      await executeT(btStrategyRepo.executeBtStrategy(btStrategyId));

      expect(serverHasBeenCalled).toBe(true);
    });
  });

  describe('[GIVEN] the server responds with successful response of execution ID and creation timestamp', () => {
    describe('[WHEN] execute backtesting strategy', () => {
      it('[THEN] it will return Right of the execution ID and creation timestamp', async () => {
        const btStrategyId = 'G100BRff4j' as BtStrategyId;
        const btExecutionId = 'htWiFAzgeV';
        const btExecutionCreation = new Date('2020-10-11');

        server.use(
          addRestRoute(method, createApiPath(url.replace(':id', btStrategyId)), (_, res, ctx) =>
            res(ctx.status(202), ctx.json({ id: btExecutionId, createdAt: btExecutionCreation })),
          ),
        );

        const result = await executeT(btStrategyRepo.executeBtStrategy(btStrategyId));

        expect(result).toEqualRight({ id: btExecutionId, createdAt: btExecutionCreation });
      });
    });
  });

  describe('[GIVEN] the server responds with HTTP error', () => {
    describe('[WHEN] execute backtesting strategy', () => {
      it('[THEN] it will return Left of error', async () => {
        const btStrategyId = 'G100BRff4j' as BtStrategyId;

        server.use(
          addRestRoute(method, createApiPath(url.replace(':id', btStrategyId)), (_, res, ctx) =>
            res(ctx.status(400)),
          ),
        );

        const result = await executeT(btStrategyRepo.executeBtStrategy(btStrategyId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
      });
    });
  });
});

describe('UUT: Get execution progress', () => {
  const { method, url } = API_ENDPOINTS.GET_EXECUTION_PROGRESS;

  describe('[WHEN] get execution progress', () => {
    it('[THEN] it will send a request to the server', async () => {
      const btStrategyId = '8szSkrNS4N' as BtStrategyId;
      const btExecutionId = 'SJ-jRbgW0Z' as BtExecutionId;
      const transformedUrl = url
        .replace(':btStrategyId', btStrategyId)
        .replace(':btExecutionId', btExecutionId);

      let serverHasBeenCalled = false;
      server.use(
        addRestRoute(method, createApiPath(transformedUrl), (_, res, ctx) => {
          serverHasBeenCalled = true;
          return res(
            ctx.status(200),
            ctx.json({ id: btExecutionId, btStrategyId, status: 'PENDING', percentage: 0, logs: [] }),
          );
        }),
      );

      await executeT(btStrategyRepo.getExecutionProgress(btStrategyId, btExecutionId));

      expect(serverHasBeenCalled).toBe(true);
    });
  });

  describe('[GIVEN] the server responds successful response with execution ID, backtesting strategy ID, status, progress percentage, and logs', () => {
    describe('[WHEN] get execution progress', () => {
      it('[THEN] it will return Right of status, progress percentage, and logs', async () => {
        const btStrategyId = '8szSkrNS4N' as BtStrategyId;
        const btExecutionId = 'SJ-jRbgW0Z' as BtExecutionId;
        const transformedUrl = url
          .replace(':btStrategyId', btStrategyId)
          .replace(':btExecutionId', btExecutionId);

        server.use(
          addRestRoute(method, createApiPath(transformedUrl), (_, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json({ id: btExecutionId, btStrategyId, status: 'PENDING', percentage: 0, logs: [] }),
            ),
          ),
        );

        const result = await executeT(btStrategyRepo.getExecutionProgress(btStrategyId, btExecutionId));

        expect(result).toEqualRight({ status: 'PENDING', percentage: 0, logs: [] });
      });
    });
  });

  describe('[GIVEN] the server responds HTTP error', () => {
    describe('[WHEN] get execution progress', () => {
      it('[THEN] it will return Left of error', async () => {
        const btStrategyId = '8szSkrNS4N' as BtStrategyId;
        const btExecutionId = 'SJ-jRbgW0Z' as BtExecutionId;
        const transformedUrl = url
          .replace(':btStrategyId', btStrategyId)
          .replace(':btExecutionId', btExecutionId);

        server.use(
          addRestRoute(method, createApiPath(transformedUrl), (_, res, ctx) => res(ctx.status(404))),
        );

        const result = await executeT(btStrategyRepo.getExecutionProgress(btStrategyId, btExecutionId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
      });
    });
  });
});

describe('UUT: Get execution result', () => {
  const { method, url } = API_ENDPOINTS.GET_EXECUTION_RESULT;
  const response = {
    status: btExecutionStatusEnum.FINISHED,
    executionTimeMs: 10000,
    logs: ['log1'],
    orders: {
      openingOrders: [],
      submittedOrders: [],
      triggeredOrders: [],
      filledOrders: [],
      canceledOrders: [],
      rejectedOrders: [],
    },
    trades: { openingTrades: [], closedTrades: [] },
    performance: {
      netReturn: 99,
      netProfit: 99,
      netLoss: 99,
      buyAndHoldReturn: 99,
      maxDrawdown: 999,
      maxRunup: 999,
      returnOfInvestment: 99,
      profitFactor: 99,
      totalTradeVolume: 99,
      totalFees: { inCapitalCurrency: 9, inAssetCurrency: 9 },
      backtestDuration: '1 days',
      winLossMetrics: {
        numOfTotalTrades: 19,
        numOfWinningTrades: 19,
        numOfLosingTrades: 19,
        numOfEvenTrades: 19,
        winRate: 9.9,
        lossRate: 9.9,
        evenRate: 9.9,
        avgProfit: 9.9,
        avgLoss: 9.9,
        largestProfit: 9.9,
        largestLoss: 9.9,
      },
    },
  };

  describe('[WHEN] get execution result', () => {
    it('[THEN] it will send a request to the server', async () => {
      const btStrategyId = '8szSkrNS4N' as BtStrategyId;
      const btExecutionId = 'SJ-jRbgW0Z' as BtExecutionId;
      const transformedUrl = url
        .replace(':btStrategyId', btStrategyId)
        .replace(':btExecutionId', btExecutionId);

      let serverHasBeenCalled = false;
      server.use(
        addRestRoute(method, createApiPath(transformedUrl), (_, res, ctx) => {
          serverHasBeenCalled = true;
          return res(ctx.status(200), ctx.json(response));
        }),
      );

      await executeT(btStrategyRepo.getExecutionResult(btStrategyId, btExecutionId));

      expect(serverHasBeenCalled).toBe(true);
    });
  });

  describe('[GIVEN] the server responds successful response', () => {
    describe('[WHEN] get execution result', () => {
      it('[THEN] it will return Right of the response', async () => {
        const btStrategyId = '8szSkrNS4N' as BtStrategyId;
        const btExecutionId = 'SJ-jRbgW0Z' as BtExecutionId;
        const transformedUrl = url
          .replace(':btStrategyId', btStrategyId)
          .replace(':btExecutionId', btExecutionId);

        server.use(
          addRestRoute(method, createApiPath(transformedUrl), (_, res, ctx) =>
            res(ctx.status(200), ctx.json(response)),
          ),
        );

        const result = await executeT(btStrategyRepo.getExecutionResult(btStrategyId, btExecutionId));

        expect(result).toEqualRight(response);
      });
    });
  });

  describe('[GIVEN] the server responds HTTP error', () => {
    describe('[WHEN] get execution result', () => {
      it('[THEN] it will return Left of error', async () => {
        const btStrategyId = '8szSkrNS4N' as BtStrategyId;
        const btExecutionId = 'SJ-jRbgW0Z' as BtExecutionId;
        const transformedUrl = url
          .replace(':btStrategyId', btStrategyId)
          .replace(':btExecutionId', btExecutionId);

        server.use(
          addRestRoute(method, createApiPath(transformedUrl), (_, res, ctx) => res(ctx.status(404))),
        );

        const result = await executeT(btStrategyRepo.getExecutionResult(btStrategyId, btExecutionId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
      });
    });
  });
});
