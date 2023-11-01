import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from '#features/symbols/DAOs/symbol.js';
import { executeIo } from '#shared/utils/fp.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { clearCollections, createMongoClient } from '#test-utils/mongoDb.js';

import { expectHttpStatus } from './commands/expect.js';
import { getKlinesByQuery } from './commands/klines.js';

const client = await createMongoClient();
executeIo(buildSymbolDao(client));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => clearCollections(client));
afterAll(() => client.disconnect());

describe('[GIVEN] user sends request exchange, symbol, timeframe, start timestamp and end timestamp params', () => {
  describe('[WHEN] get klines by query', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const query = { startTimestamp: new Date('2010-10-03').toISOString() };

      const { response } = await getKlinesByQuery(query);

      expectHttpStatus(response, 400);
      expect(response.data).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] user sends valid request', () => {
  describe('[WHEN] get klines by query', () => {
    it('[THEN] it will return HTTP200 and a list of klines', async () => {
      await symbolModel.create(mockBnbSymbol({ exchange: 'BINANCE', name: 'BTCUSDT' }));

      const query = {
        exchange: 'BINANCE',
        symbol: 'BTCUSDT',
        timeframe: '1d',
        startTimestamp: new Date('2021-01-03'),
        endTimestamp: new Date('2021-01-04'),
      };

      const { response } = await getKlinesByQuery(query);

      expectHttpStatus(response, 200);
      expect(response.data).toHaveLength(1);
    });
  });
});
