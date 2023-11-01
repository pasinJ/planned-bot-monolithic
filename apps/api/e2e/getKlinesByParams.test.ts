// import { flow } from 'fp-ts/lib/function.js';
// import { equals, keys } from 'ramda';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';

// import { clearCollections, createMongoClient } from '#test-utils/mongoDb.js';
import { expectHttpStatus } from './commands/expect.js';
import { getKlinesByParams } from './commands/klines.js';

// const client = await createMongoClient();
// executeIo(buildSymbolDao(client));
// const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

// afterEach(() => clearCollections(client));
// afterAll(() => client.disconnect());

describe('[GIVEN] user sends request exchange, symbol, timeframe, start timestamp and end timestamp params', () => {
  describe('[WHEN] get klines by params', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const params = { startTimestamp: new Date('2010-10-03').toISOString() };

      const { response } = await getKlinesByParams(params);

      expectHttpStatus(response, 400);
      expect(response.data).toEqual(toBeHttpErrorResponse);
    });
  });
});
