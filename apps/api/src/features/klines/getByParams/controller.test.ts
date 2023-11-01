import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { createKlineDaoError } from '#features/btStrategies/DAOs/kline.error.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { createSymbolDaoError } from '#features/symbols/DAOs/symbol.error.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { generateArrayOf } from '#test-utils/faker/helper.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { mockKline } from '#test-utils/features/shared/kline.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { KLINE_ENDPOINTS } from '../routes.constant.js';
import { GetKlinesByQueryControllerDeps, buildGetKlinesByQueryController } from './controller.js';

function mockDeps(override?: DeepPartial<GetKlinesByQueryControllerDeps>): GetKlinesByQueryControllerDeps {
  return mergeDeepRight<GetKlinesByQueryControllerDeps, DeepPartial<GetKlinesByQueryControllerDeps>>(
    {
      symbolDao: { getByNameAndExchange: jest.fn().mockReturnValue(te.right(mockBnbSymbol())) },
      klineDao: {
        count: jest.fn().mockReturnValue(te.right(10)),
        get: jest.fn().mockReturnValue(te.right(generateArrayOf(mockKline))),
        add: jest.fn().mockReturnValue(te.right(undefined)),
      },
      bnbService: { downloadKlines: jest.fn().mockReturnValue(te.right(generateArrayOf(mockKline))) },
    },
    override ?? {},
  );
}

const { method, url } = KLINE_ENDPOINTS.GET_BY_PARAMS;
const setupServer = setupTestServer(method, url, buildGetKlinesByQueryController, mockDeps);

describe('[GIVEN] user sends request without exchange, symbol, timeframe, start timestamp and end timestamp query', () => {
  describe('[WHEN] get klines by query', () => {
    it('[THEN] it will return HTTP400 with error response', async () => {
      const httpServer = setupServer();
      const query = { startTimestamp: new Date('2010-10-03').toISOString() };

      const resp = await httpServer.inject({ method, url, query });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the symbol does not exist', () => {
  describe('[WHEN] get klines by query', () => {
    it('[THEN] it will return HTTP400 with error response', async () => {
      const httpServer = setupServer({
        symbolDao: { getByNameAndExchange: () => te.left(createSymbolDaoError('NotExist', 'Mock')) },
      });
      const query = {
        exchange: 'BINANCE',
        symbol: 'BTCUSDT',
        timeframe: timeframeEnum['15m'],
        startTimestamp: new Date('2010-10-03').toISOString(),
        endTimestamp: new Date('2010-10-03').toISOString(),
      };

      const resp = await httpServer.inject({ method, url, query });

      expect(resp.statusCode).toBe(400);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the symbol exists [BUT] counting klines failed', () => {
  describe('[WHEN] get klines by query', () => {
    it('[THEN] it will return HTTP500 with error response', async () => {
      const httpServer = setupServer({
        symbolDao: { getByNameAndExchange: () => te.right(mockBnbSymbol()) },
        klineDao: { count: () => te.left(createKlineDaoError('CountFailed', 'Mock')) },
      });
      const query = {
        exchange: 'BINANCE',
        symbol: 'BTCUSDT',
        timeframe: timeframeEnum['15m'],
        startTimestamp: new Date('2010-10-03').toISOString(),
        endTimestamp: new Date('2010-10-03').toISOString(),
      };

      const resp = await httpServer.inject({ method, url, query });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the symbol exists [BUT] getting klines failed', () => {
  describe('[WHEN] get klines by query', () => {
    it('[THEN] it will return HTTP500 with error response', async () => {
      const httpServer = setupServer({
        symbolDao: { getByNameAndExchange: () => te.right(mockBnbSymbol()) },
        klineDao: { count: () => te.right(0), get: () => te.left(createKlineDaoError('GetFailed', 'Mock')) },
      });
      const query = {
        exchange: 'BINANCE',
        symbol: 'BTCUSDT',
        timeframe: timeframeEnum['15m'],
        startTimestamp: new Date('2010-10-03').toISOString(),
        endTimestamp: new Date('2010-10-03').toISOString(),
      };

      const resp = await httpServer.inject({ method, url, query });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the symbol exists [AND] klines already exist in database', () => {
  describe('[WHEN] get klines by query', () => {
    it('[THEN] it will return HTTP200 with a list of klines', async () => {
      const klines = generateArrayOf(mockKline);
      const httpServer = setupServer({
        symbolDao: { getByNameAndExchange: () => te.right(mockBnbSymbol()) },
        klineDao: { count: () => te.right(0), get: () => te.right(klines) },
      });
      const query = {
        exchange: 'BINANCE',
        symbol: 'BTCUSDT',
        timeframe: timeframeEnum['15m'],
        startTimestamp: new Date('2010-10-03').toISOString(),
        endTimestamp: new Date('2010-10-03').toISOString(),
      };

      const resp = await httpServer.inject({ method, url, query });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toEqual(
        klines.map(({ openTimestamp, closeTimestamp, ...rest }) => ({
          ...rest,
          openTimestamp: openTimestamp.toISOString(),
          closeTimestamp: closeTimestamp.toISOString(),
        })),
      );
    });
  });
});
