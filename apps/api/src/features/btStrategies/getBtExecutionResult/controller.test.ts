import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { generateOrderId } from '#features/shared/order.js';
import { generateTradeId } from '#features/shared/trade.js';
import { createGeneralError } from '#shared/errors/generalError.js';
import { Milliseconds } from '#shared/utils/date.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockBtStrategyModel } from '#test-utils/features/btStrategies/btStrategy.js';
import { mockKline } from '#test-utils/features/shared/kline.js';
import { mockStrategyModule } from '#test-utils/features/shared/strategyModule.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createKlineDaoError } from '../../klines/DAOs/kline.error.js';
import { createBtExecutionDaoError } from '../DAOs/btExecution.error.js';
import { createBtStrategyDaoError } from '../DAOs/btStrategy.error.js';
import { BtExecutionId, btExecutionStatusEnum } from '../dataModels/btExecution.js';
import { BtStrategyId } from '../dataModels/btStrategy.js';
import { BT_STRATEGY_ENDPOINTS } from '../routes.constant.js';
import { GetBtExecutionResultControllerDeps, buildGetBtExecutionResultController } from './controller.js';

function mockDeps(
  override?: DeepPartial<GetBtExecutionResultControllerDeps>,
): GetBtExecutionResultControllerDeps {
  const executionResult = {
    id: 'dE9BfrA7u_' as BtExecutionId,
    btStrategyId: 'pa1A4gBBDG' as BtStrategyId,
    status: btExecutionStatusEnum.FAILED,
    logs: ['log1', 'log2'],
    executionTimeMs: 10 as Milliseconds,
    error: createGeneralError('Error', 'Mock').toJSON(),
  };

  return mergeDeepRight<GetBtExecutionResultControllerDeps, DeepPartial<GetBtExecutionResultControllerDeps>>(
    {
      btExecutionDao: { getResultById: () => te.right(executionResult) },
      btStrategyDao: { getById: () => te.right(mockBtStrategyModel()) },
      klineDao: { getLastBefore: () => te.right(mockKline()) },
      generateOrderId,
      generateTradeId,
    },
    override ?? {},
  );
}

const { method, url } = BT_STRATEGY_ENDPOINTS.GET_BT_RESULT;
const setupServer = setupTestServer(method, url, buildGetBtExecutionResultController, mockDeps);
const btStrategyId = '8p1v74s2vK';
const executionId = 'G8i7cPF5pV';
const successfulResult = {
  id: executionId as BtExecutionId,
  btStrategyId: 'rX3d7U_JUt' as BtStrategyId,
  status: btExecutionStatusEnum.FINISHED,
  logs: ['log1', 'log2'],
  executionTimeMs: 10 as Milliseconds,
  strategyModule: mockStrategyModule(),
  orders: {
    openingOrders: [],
    submittedOrders: [],
    triggeredOrders: [],
    filledOrders: [],
    canceledOrders: [],
    rejectedOrders: [],
  },
  trades: { openingTrades: [], closedTrades: [] },
};

describe('[GIVEN] user send an empty string as execution ID', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const getResultUrl = url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', '');
      const httpServer = setupServer();

      const resp = await httpServer.inject({ method, url: getResultUrl });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the execution ID does not exist', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP404 and error response body', async () => {
      const error = createBtExecutionDaoError('NotExist', 'Mock');
      const httpServer = setupServer({ btExecutionDao: { getResultById: () => te.left(error) } });
      const getResultUrl = url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', executionId);

      const resp = await httpServer.inject({ method, url: getResultUrl });

      expect(resp.statusCode).toBe(404);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] DAO fails to get backtest execution result', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP500 and error response body', async () => {
      const error = createBtExecutionDaoError('GetResultByIdFailed', 'Mock');
      const httpServer = setupServer({ btExecutionDao: { getResultById: () => te.left(error) } });
      const getResultUrl = url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', executionId);

      const resp = await httpServer.inject({ method, url: getResultUrl });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the execution has PENDING or RUNNING status', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP409 and error response body', async () => {
      const error = createBtExecutionDaoError('InvalidStatus', 'Mock');
      const httpServer = setupServer({ btExecutionDao: { getResultById: () => te.left(error) } });
      const getResultUrl = url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', executionId);

      const resp = await httpServer.inject({ method, url: getResultUrl });

      expect(resp.statusCode).toBe(409);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the execution is not successful', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP200 and execution result response body', async () => {
      const executionResult = {
        id: executionId as BtExecutionId,
        btStrategyId: 'rX3d7U_JUt' as BtStrategyId,
        status: btExecutionStatusEnum.FAILED,
        logs: ['log1', 'log2'],
        executionTimeMs: 10 as Milliseconds,
        error: createGeneralError('Error', 'Mock').toJSON(),
      };
      const httpServer = setupServer({ btExecutionDao: { getResultById: () => te.right(executionResult) } });
      const getResultUrl = url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', executionId);

      const resp = await httpServer.inject({ method, url: getResultUrl });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toEqual(executionResult);
    });
  });
});

describe('[GIVEN] the execution is successful [BUT] DAO fails to get backtesting strategy by ID', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP500 and error response body', async () => {
      const error = createBtStrategyDaoError('GetByIdFailed', 'Mock');
      const httpServer = setupServer({
        btExecutionDao: { getResultById: () => te.right(successfulResult) },
        btStrategyDao: { getById: () => te.left(error) },
      });
      const getResultUrl = url.replace(':btExecutionId', executionId);

      const resp = await httpServer.inject({ method, url: getResultUrl });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the execution is successful [BUT] the backtesting strategy does not exist', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP409 and error response body', async () => {
      const error = createBtStrategyDaoError('NotExist', 'Mock');
      const httpServer = setupServer({
        btExecutionDao: { getResultById: () => te.right(successfulResult) },
        btStrategyDao: { getById: () => te.left(error) },
      });
      const getResultUrl = url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', executionId);

      const resp = await httpServer.inject({ method, url: getResultUrl });

      expect(resp.statusCode).toBe(409);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the execution is successful [BUT] DAO fails to get last kline before the end of backtest', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP500 and error response body', async () => {
      const error = createKlineDaoError('GetLastBeforeFailed', 'Mock');
      const httpServer = setupServer({
        btExecutionDao: { getResultById: () => te.right(successfulResult) },
        btStrategyDao: { getById: () => te.right(mockBtStrategyModel()) },
        klineDao: { getLastBefore: () => te.left(error) },
      });
      const getResultUrl = url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', executionId);

      const resp = await httpServer.inject({ method, url: getResultUrl });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the execution is successful [AND] every thing works fine', () => {
  describe('[WHEN] user send a request to get backtesting execution result', () => {
    it('[THEN] it will return HTTP200 and execution result response body', async () => {
      const httpServer = setupServer({
        btExecutionDao: { getResultById: () => te.right(successfulResult) },
        btStrategyDao: { getById: () => te.right(mockBtStrategyModel()) },
        klineDao: { getLastBefore: () => te.right(mockKline()) },
      });
      const getResultUrl = url.replace(':btStrategyId', btStrategyId).replace(':btExecutionId', executionId);

      const resp = await httpServer.inject({ method, url: getResultUrl });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toContainAllKeys([
        'id',
        'btStrategyId',
        'status',
        'executionTimeMs',
        'logs',
        'orders',
        'trades',
        'performance',
      ]);
    });
  });
});
