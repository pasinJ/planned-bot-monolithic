import { path } from 'ramda';

import { btExecutionStatusList } from '#features/btStrategies/dataModels/btExecution.js';
import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from '#features/symbols/DAOs/symbol.js';
import { executeIo } from '#shared/utils/fp.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { clearCollections, createMongoClient } from '#test-utils/mongoDb.js';

import { addBtStrategy, executeBtStrategy, getBtExecutionProgressById } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

const client = await createMongoClient();
executeIo(buildSymbolDao(client));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];
const btStrategyId = '-l50r9Z1GK';

afterEach(() => clearCollections(client));
afterAll(() => client.disconnect());

describe('[GIVEN] user sends an empty string as execution ID', () => {
  describe('[WHEN] get backtesting execution progress by ID', () => {
    it('[THEN] it will return HTTP400 and error response body', async () => {
      const executionId = '';

      const { response } = await getBtExecutionProgressById(btStrategyId, executionId);

      expectHttpStatus(response, 400);
      expect(response.data).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the execution ID does not exist', () => {
  describe('[WHEN] get backtesting execution progress by ID', () => {
    it('[THEN] it will return HTTP404 and error response body', async () => {
      const executionId = 'IekAhOdDxG';

      const { response } = await getBtExecutionProgressById(btStrategyId, executionId);

      expectHttpStatus(response, 404);
      expect(response.data).toEqual(toBeHttpErrorResponse);
    });
  });
});

describe('[GIVEN] the execution ID exists', () => {
  describe('[WHEN] get backtesting execution progress by ID', () => {
    it('[THEN] it will return HTTP200 and progress information in response body', async () => {
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
      const { response: executeBtResponse } = await executeBtStrategy(btStrategyId);

      const executionId = path(['data', 'id'], executeBtResponse) as string;
      const { response: progressResponse } = await getBtExecutionProgressById(btStrategyId, executionId);

      expectHttpStatus(progressResponse, 200);
      expect(progressResponse.data).toEqual({
        id: executionId,
        btStrategyId,
        status: expect.toBeOneOf(btExecutionStatusList),
        percentage: expect.toBeNumber(),
        logs: expect.toBeArray(),
      });
    });
  });
});
