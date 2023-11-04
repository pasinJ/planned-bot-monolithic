import { path } from 'ramda';

import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from '#features/symbols/DAOs/symbol.js';
import { executeIo } from '#shared/utils/fp.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import {
  mockValidAddBtStrategyRequestBody,
  mockValidUpdateBtStrategyRequestBody,
} from '#test-utils/features/btStrategies/apis.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { clearCollections, createMongoClient } from '#test-utils/mongoDb.js';

import { addBtStrategy, updateBtStrategy } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

const client = await createMongoClient();
executeIo(buildSymbolDao(client));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => clearCollections(client));
afterAll(async () => {
  await clearCollections(client);
  await client.disconnect();
});

describe('[GIVEN] the backtesting strategy already exists', () => {
  describe('[WHEN] user update a backtesting strategy', () => {
    it('[THEN] it should return HTTP200 and updating timestamp', async () => {
      const addStrategyRequest = mockValidAddBtStrategyRequestBody();
      const symbol = mockBnbSymbol({
        name: addStrategyRequest.symbol,
        exchange: addStrategyRequest.exchange,
        baseAsset: addStrategyRequest.capitalCurrency,
        quoteAsset: addStrategyRequest.assetCurrency,
      });
      await symbolModel.create(symbol);

      const { response: addResponse } = await addBtStrategy(addStrategyRequest);
      const btStrategyId = path(['data', 'id'], addResponse) as string;

      const updateBtStrategyBody = mockValidUpdateBtStrategyRequestBody();
      const { response } = await updateBtStrategy(btStrategyId, updateBtStrategyBody);

      expectHttpStatus(response, 200);
      expect(response.data).toEqual({ updatedAt: expect.toBeDateString() });
    });
  });
});

describe('[GIVEN] the backtesting strategy does not exist', () => {
  describe('[WHEN] user update a backtesting strategy', () => {
    it('[THEN] it should return HTTP404 and error response body', async () => {
      const btStrategyId = '0LzGK7YaVg';
      const updateBtStrategyBody = mockValidUpdateBtStrategyRequestBody();
      const symbol = mockBnbSymbol({
        name: updateBtStrategyBody.symbol,
        exchange: updateBtStrategyBody.exchange,
        baseAsset: updateBtStrategyBody.capitalCurrency,
        quoteAsset: updateBtStrategyBody.assetCurrency,
      });
      await symbolModel.create(symbol);

      const { response } = await updateBtStrategy(btStrategyId, updateBtStrategyBody);

      expectHttpStatus(response, 404);
      expect(response.data).toEqual(toBeHttpErrorResponse);
    });
  });
});
