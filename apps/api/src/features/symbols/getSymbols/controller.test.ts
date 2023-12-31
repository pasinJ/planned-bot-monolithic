import te from 'fp-ts/lib/TaskEither.js';
import { mergeDeepRight, pick } from 'ramda';
import { DeepPartial } from 'ts-essentials';

import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { createSymbolDaoError } from '../DAOs/symbol.error.js';
import { SYMBOLS_ENDPOINTS } from '../routes.constant.js';
import { GetSymbolsControllerDeps, buildGetSymbolsController } from './controller.js';

function mockDeps(overrides?: DeepPartial<GetSymbolsControllerDeps>): GetSymbolsControllerDeps {
  return mergeDeepRight(
    {
      symbolDao: { getAll: te.right([mockBnbSymbol({ name: 'BNBUSDT' })]) },
    },
    overrides ?? {},
  ) as GetSymbolsControllerDeps;
}

const { method, url } = SYMBOLS_ENDPOINTS.GET_SYMBOLS;
const setupServer = setupTestServer(method, url, buildGetSymbolsController, mockDeps);

describe('[GIVEN] there is no existing symbol', () => {
  describe('[WHEN] get symbols', () => {
    it('[THEN] it will return HTTP200 and empty array', async () => {
      const httpServer = setupServer({ symbolDao: { getAll: te.right([]) } });

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toBeArrayOfSize(0);
    });
  });
});

describe('[GIVEN] there is an existing symbol', () => {
  describe('[WHEN] get symbols', () => {
    it('[THEN] it will return HTTP200 and an array of the existing symbols', async () => {
      const symbols = [mockBnbSymbol({ name: 'BNBUSDT' }), mockBnbSymbol({ name: 'BTCUSDT' })];
      const httpServer = setupServer({ symbolDao: { getAll: te.right(symbols) } });

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(200);
      expect(resp.json()).toIncludeAllMembers(
        symbols.map(pick(['name', 'exchange', 'baseAsset', 'quoteAsset'])),
      );
    });
  });
});

describe('[GIVEN] DAO fails to get symbols from database', () => {
  describe('[WHEN] get symbols', () => {
    it('[THEN] it will return HTTP500 with error response', async () => {
      const error = createSymbolDaoError('GetAllFailed', 'Mock');
      const httpServer = setupServer({ symbolDao: { getAll: te.left(error) } });

      const resp = await httpServer.inject({ method, url });

      expect(resp.statusCode).toBe(500);
      expect(resp.json()).toEqual(toBeHttpErrorResponse);
    });
  });
});
