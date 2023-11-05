import { setupServer } from 'msw/node';

import { exchangeNameEnum } from '#features/exchanges/exchange';
import { timeframeEnum } from '#features/klines/kline';
import { SymbolName } from '#features/symbols/symbol';
import { createAxiosHttpClient } from '#infra/axiosHttpClient';
import { executeT } from '#shared/utils/fp';
import { TimezoneString } from '#shared/utils/string';
import executionResultResponse from '#test-utils/execution-result.json';
import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/btStrategies/btStrategy';
import { addRestRoute, createApiPath } from '#test-utils/msw';

import { BtExecutionId } from './btExecution';
import {
  AssetCurrency,
  BtRange,
  BtStrategyBody,
  BtStrategyId,
  BtStrategyName,
  CapitalCurrency,
  InitialCapital,
  MakerFeeRate,
  MaxNumKlines,
  TakerFeeRate,
} from './btStrategy';
import { AddBtStrategyRequest, UpdateBtStrategyRequest, createBtStrategyRepo } from './btStrategy.repository';
import { isBtStrategyRepoError } from './btStrategy.repository.error';
import { API_ENDPOINTS } from './endpoints';

const httpClient = createAxiosHttpClient();
const btStrategyRepo = createBtStrategyRepo({ httpClient });
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UUT: Get backtesting strategy by ID', () => {
  const { url, method } = API_ENDPOINTS.GET_BT_STRATEGY;

  describe('[WHEN] get backtesting strategy by ID', () => {
    it('[THEN] it will send a GET request to the server', async () => {
      let serverHasBeenCalled = false;
      server.use(
        addRestRoute(method, createApiPath(url), async (_, res, ctx) => {
          serverHasBeenCalled = true;
          return res(ctx.status(200), ctx.json(mockBtStrategy()));
        }),
      );
      const id = 'M0rCxGh2EW';

      await executeT(btStrategyRepo.getBtStrategyById(id));

      expect(serverHasBeenCalled).toBe(true);
    });
  });

  describe('[GIVEN] the server responds successful response with a backtesting strategy', () => {
    describe('[WHEN] get backtesting strategy by ID', () => {
      it('[THEN] it will return Right of the backtesting strategy', async () => {
        const strategy = mockBtStrategy();
        server.use(
          addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(200), ctx.json(strategy))),
        );

        const result = await executeT(btStrategyRepo.getBtStrategyById(strategy.id));

        expect(result).toEqualRight(strategy);
      });
    });
  });

  describe('[GIVEN] the server responds HTTP error', () => {
    describe('[WHEN] get backtesting strategy by ID', () => {
      it('[THEN] it will return Left of error', async () => {
        server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));
        const id = 'M0rCxGh2EW';

        const result = await executeT(btStrategyRepo.getBtStrategyById(id));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
      });
    });
  });
});

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
    name: 'strategy name' as BtStrategyName,
    exchange: exchangeNameEnum.BINANCE,
    symbol: 'BNBUSDT' as SymbolName,
    timeframe: timeframeEnum['15m'],
    maxNumKlines: 100 as MaxNumKlines,
    btRange: { start: new Date('2010-02-03'), end: new Date('2010-02-04') } as BtRange,
    timezone: 'Asia/Bangkok' as TimezoneString,
    assetCurrency: 'BNB' as AssetCurrency,
    capitalCurrency: 'USDT' as CapitalCurrency,
    initialCapital: 100.1 as InitialCapital,
    takerFeeRate: 0.1 as TakerFeeRate,
    makerFeeRate: 0.1 as MakerFeeRate,
    language: 'javascript',
    body: 'console.log("Hi")' as BtStrategyBody,
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
        btRange: { start: '2010-02-03T00:00:00.000Z', end: '2010-02-04T00:00:00.000Z' },
        timezone: 'Asia/Bangkok',
        assetCurrency: 'BNB',
        capitalCurrency: 'USDT',
        initialCapital: 100.1,
        takerFeeRate: 0.1,
        makerFeeRate: 0.1,
        language: 'javascript',
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
    name: 'strategy name' as BtStrategyName,
    exchange: exchangeNameEnum.BINANCE,
    symbol: 'BNBUSDT' as SymbolName,
    timeframe: timeframeEnum['15m'],
    maxNumKlines: 100 as MaxNumKlines,
    btRange: { start: new Date('2010-02-03'), end: new Date('2010-02-04') } as BtRange,
    timezone: 'Asia/Bangkok' as TimezoneString,
    assetCurrency: 'BNB' as AssetCurrency,
    capitalCurrency: 'USDT' as CapitalCurrency,
    initialCapital: 100.1 as InitialCapital,
    takerFeeRate: 0.1 as TakerFeeRate,
    makerFeeRate: 0.1 as MakerFeeRate,
    language: 'javascript',
    body: 'console.log("Hi")' as BtStrategyBody,
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
        btRange: { start: '2010-02-03T00:00:00.000Z', end: '2010-02-04T00:00:00.000Z' },
        timezone: 'Asia/Bangkok',
        assetCurrency: 'BNB',
        capitalCurrency: 'USDT',
        initialCapital: 100.1,
        takerFeeRate: 0.1,
        makerFeeRate: 0.1,
        language: 'javascript',
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

describe('UUT: Get last execution progress', () => {
  const { method, url } = API_ENDPOINTS.GET_LAST_EXECUTION_PROGRESS;

  describe('[WHEN] get last execution progress', () => {
    it('[THEN] it will send a request to the server', async () => {
      const btStrategyId = '8szSkrNS4N' as BtStrategyId;
      const transformedUrl = url.replace(':btStrategyId', btStrategyId);

      let serverHasBeenCalled = false;
      server.use(
        addRestRoute(method, createApiPath(transformedUrl), (_, res, ctx) => {
          serverHasBeenCalled = true;
          return res(
            ctx.status(200),
            ctx.json({ id: 'SJ-jRbgW0Z', btStrategyId, status: 'PENDING', percentage: 0, logs: [] }),
          );
        }),
      );

      await executeT(btStrategyRepo.getLastExecutionProgress(btStrategyId));

      expect(serverHasBeenCalled).toBe(true);
    });
  });

  describe('[GIVEN] the server responds successful response with execution ID, backtesting strategy ID, status, progress percentage, and logs', () => {
    describe('[WHEN] get last execution progress', () => {
      it('[THEN] it will return Right of execution ID, backtesting strategy ID, status, progress percentage, and logs', async () => {
        const btStrategyId = '8szSkrNS4N' as BtStrategyId;
        const transformedUrl = url.replace(':btStrategyId', btStrategyId);

        server.use(
          addRestRoute(method, createApiPath(transformedUrl), (_, res, ctx) =>
            res(
              ctx.status(200),
              ctx.json({ id: 'SJ-jRbgW0Z', btStrategyId, status: 'PENDING', percentage: 0, logs: [] }),
            ),
          ),
        );

        const result = await executeT(btStrategyRepo.getLastExecutionProgress(btStrategyId));

        expect(result).toEqualRight({
          id: 'SJ-jRbgW0Z',
          btStrategyId,
          status: 'PENDING',
          percentage: 0,
          logs: [],
        });
      });
    });
  });

  describe('[GIVEN] the server responds HTTP error', () => {
    describe('[WHEN] get last execution progress', () => {
      it('[THEN] it will return Left of error', async () => {
        const btStrategyId = '8szSkrNS4N' as BtStrategyId;
        const transformedUrl = url.replace(':btStrategyId', btStrategyId);

        server.use(
          addRestRoute(method, createApiPath(transformedUrl), (_, res, ctx) => res(ctx.status(404))),
        );

        const result = await executeT(btStrategyRepo.getLastExecutionProgress(btStrategyId));

        expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
      });
    });
  });
});

describe('UUT: Get execution result', () => {
  const { method, url } = API_ENDPOINTS.GET_EXECUTION_RESULT;
  const response = executionResultResponse;

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
      it('[THEN] it will return Right', async () => {
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

        expect(result).toBeRight();
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
