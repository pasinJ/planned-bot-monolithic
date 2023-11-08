import { path } from 'ramda';

import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from '#features/symbols/DAOs/symbol.js';
import { executeIo } from '#shared/utils/fp.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { clearCollections, createMongoClient } from '#test-utils/mongoDb.js';

import { addBtStrategy, getBtStrategies } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

const client = await createMongoClient();
executeIo(buildSymbolDao(client));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => clearCollections(client));
afterAll(() => client.disconnect());

describe('[GIVEN] there is no backtesting strategy exists', () => {
  describe('[WHEN] get backtesting strategies', () => {
    it('[THEN] it will return HTTP200 with an empty array', async () => {
      const { response } = await getBtStrategies();

      expectHttpStatus(response, 200);
      expect(response.data).toEqual([]);
    });
  });
});

describe('[GIVEN] there are some backtesting strategies exist', () => {
  describe('[WHEN] get backtesting strategies', () => {
    it('[THEN] it will return HTTP200 with an array of backtesting strategy', async () => {
      const addBtStrategyRequest = mockValidAddBtStrategyRequestBody();
      const symbol = mockBnbSymbol({
        name: addBtStrategyRequest.symbol,
        exchange: addBtStrategyRequest.exchange,
        baseAsset: addBtStrategyRequest.capitalCurrency,
        quoteAsset: addBtStrategyRequest.assetCurrency,
      });
      await symbolModel.create(symbol);

      const { response: addBtStrategyResp } = await addBtStrategy(addBtStrategyRequest);

      const btStrategyId = path(['data', 'id'], addBtStrategyResp) as string;
      const { response: getBtStrategiesResp } = await getBtStrategies();

      expectHttpStatus(getBtStrategiesResp, 200);
      expect(getBtStrategiesResp.data).toEqual([
        {
          ...addBtStrategyRequest,
          id: btStrategyId,
          version: 0,
          createdAt: expect.toBeDateString(),
          updatedAt: expect.toBeDateString(),
        },
      ]);
    });
  });
});
