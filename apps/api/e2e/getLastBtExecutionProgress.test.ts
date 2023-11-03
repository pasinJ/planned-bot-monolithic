import { path } from 'ramda';

import { btExecutionStatusList } from '#features/btStrategies/dataModels/btExecution.js';
import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from '#features/symbols/DAOs/symbol.js';
import { executeIo } from '#shared/utils/fp.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { clearCollections, createMongoClient } from '#test-utils/mongoDb.js';

import { addBtStrategy, executeBtStrategy, getLastBtExecutionProgress } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

const client = await createMongoClient();
executeIo(buildSymbolDao(client));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => clearCollections(client));
afterAll(() => client.disconnect());

describe('[GIVEN] the last execution of backtesting strategy does not exist', () => {
  describe('[WHEN] get the last execution progress', () => {
    it('[THEN] it will return HTTP200 with null response body', async () => {
      const btStrategyId = '-l50r9Z1GK';

      const { response } = await getLastBtExecutionProgress(btStrategyId);

      expectHttpStatus(response, 200);
      expect(response.data).toBeNull();
    });
  });
});

describe('[GIVEN] the last execution of backtesting strategy exists', () => {
  describe('[WHEN] get the last execution progress', () => {
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
      const { response: progressResponse } = await getLastBtExecutionProgress(btStrategyId);

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
