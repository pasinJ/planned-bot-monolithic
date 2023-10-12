import { path } from 'ramda';

import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from '#features/symbols/DAOs/symbol.js';
import { executeIo } from '#shared/utils/fp.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { addBtStrategy, executeBtStrategy } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

const client = await createMongoClient();
executeIo(buildSymbolDao(client));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => symbolModel.deleteMany());
afterAll(() => client.disconnect());

describe('[GIVEN] the backtesting strategy ID does not exist', () => {
  describe('[WHEN] user sends a request to execute the backtesting strategy', () => {
    it('[THEN] it should return HTTP404 and error response body', async () => {
      const btStrategyId = 'IekAhOdDxG';

      const { response } = await executeBtStrategy(btStrategyId);

      expectHttpStatus(response, 404);
      expect(response.data).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the backtesting strategy ID already exists', () => {
  describe('[WHEN] user sends a request to execute the backtesting strategy', () => {
    it('[THEN] it should return HTTP202 and response body with id, created timestamp, progress path, and result path', async () => {
      const addStrategyRequest = mockValidAddBtStrategyRequestBody();
      const symbol = mockBnbSymbol({
        name: addStrategyRequest.symbol,
        exchange: addStrategyRequest.exchange,
        baseAsset: addStrategyRequest.capitalCurrency,
      });
      await symbolModel.create(symbol);

      const { response: addResponse } = await addBtStrategy(addStrategyRequest);
      const btStrategyId = path(['data', 'id'], addResponse) as string;

      const { response: executeResponse } = await executeBtStrategy(btStrategyId);

      expectHttpStatus(executeResponse, 202);
      expect(executeResponse.data).toEqual({
        id: expect.toBeString(),
        createdAt: expect.toBeDateString(),
        progressPath: expect.toInclude(btStrategyId),
        resultPath: expect.toInclude(btStrategyId),
      });
    });
  });
});
