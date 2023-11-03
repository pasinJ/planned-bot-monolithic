import { path } from 'ramda';

import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from '#features/symbols/DAOs/symbol.js';
import { executeIo } from '#shared/utils/fp.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { clearCollections, createMongoClient } from '#test-utils/mongoDb.js';

import { addBtStrategy, getBtStrategy } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

const client = await createMongoClient();
executeIo(buildSymbolDao(client));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => clearCollections(client));
afterAll(() => client.disconnect());

describe('[GIVEN] backtesting strategy does not exist', () => {
  describe('[WHEN] get backtesting strategy', () => {
    it('[THEN] it will return HTTP404 with error response body', async () => {
      const btStrategyId = '-l50r9Z1GK';

      const { response } = await getBtStrategy(btStrategyId);

      expectHttpStatus(response, 404);
      expect(response.data).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] backtesting strategy exists', () => {
  describe('[WHEN] get backtesting strategy', () => {
    it('[THEN] it will return HTTP200 with backtesting strategy', async () => {
      const addBtStrategyRequest = mockValidAddBtStrategyRequestBody();
      const symbol = mockBnbSymbol({
        name: addBtStrategyRequest.symbol,
        exchange: addBtStrategyRequest.exchange,
        baseAsset: addBtStrategyRequest.capitalCurrency,
        quoteAsset: addBtStrategyRequest.assetCurrency,
      });
      await symbolModel.create(symbol);

      const { response: addBtStrategyResponse } = await addBtStrategy(addBtStrategyRequest);

      const btStrategyId = path(['data', 'id'], addBtStrategyResponse) as string;
      const { response: getBtStrategyResp } = await getBtStrategy(btStrategyId);

      expectHttpStatus(getBtStrategyResp, 200);
      expect(getBtStrategyResp.data).toEqual({
        ...addBtStrategyRequest,
        id: expect.toBeString(),
        version: 0,
        createdAt: expect.toBeDateString(),
        updatedAt: expect.toBeDateString(),
      });
    });
  });
});
