import { pick } from 'ramda';

import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from '#features/symbols/DAOs/symbol.js';
import { executeIo } from '#shared/utils/fp.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { clearCollections, createMongoClient } from '#test-utils/mongoDb.js';

import { expectHttpStatus } from './commands/expect.js';
import { getSymbols } from './commands/symbols.js';

const client = await createMongoClient();
executeIo(buildSymbolDao(client));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => clearCollections(client));
afterAll(() => client.disconnect());

describe('[GIVEN] there is no existing symbols', () => {
  describe('[WHEN] get symbols', () => {
    it('[THEN] it should return HTTP200 and empty array', async () => {
      const resp = await getSymbols();

      expectHttpStatus(resp, 200);
      expect(resp.data).toBeArrayOfSize(0);
    });
  });
});

describe('[GIVEN] some symbols have been added', () => {
  describe('[WHEN] get symbols', () => {
    it('[THEN] it should return HTTP200 and an array with the added symbols', async () => {
      const symbols = [mockBnbSymbol({ name: 'ADAUSDT' }), mockBnbSymbol({ name: 'BTCUSDT' })];
      await symbolModel.insertMany(symbols);

      const getResp = await getSymbols();

      expectHttpStatus(getResp, 200);
      expect(getResp.data).toBeArrayOfSize(symbols.length);
      expect(getResp.data).toIncludeAllMembers(
        symbols.map(pick(['name', 'exchange', 'baseAsset', 'quoteAsset'])),
      );
    });
  });
});
