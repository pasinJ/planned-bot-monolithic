import { SymbolMongooseModel, buildSymbolDao, symbolModelName } from '#features/symbols/DAOs/symbol.js';
import { executeIo } from '#shared/utils/fp.js';
import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { mockValidAddBtStrategyRequestBody } from '#test-utils/features/btStrategies/apis.js';
import { mockBnbSymbol } from '#test-utils/features/shared/bnbSymbol.js';
import { clearCollections, createMongoClient } from '#test-utils/mongoDb.js';

import { addBtStrategy } from './commands/btStrategy.js';
import { expectHttpStatus } from './commands/expect.js';

const client = await createMongoClient();
executeIo(buildSymbolDao(client));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => clearCollections(client));
afterAll(() => client.disconnect());

describe('[WHEN] user successfully add a backtesting strategy', () => {
  it('[THEN] it should return HTTP201 and the created backtesting strategy ID and timestamp', async () => {
    const body = mockValidAddBtStrategyRequestBody();
    const symbol = mockBnbSymbol({
      name: body.symbol,
      exchange: body.exchange,
      baseAsset: body.capitalCurrency,
    });
    await symbolModel.create(symbol);

    const { response } = await addBtStrategy(body);

    expectHttpStatus(response, 201);
    expect(response.data).toEqual({ id: expect.toBeString(), createdAt: expect.toBeDateString() });
  });
});

describe('[GIVEN] request body is invalid', () => {
  describe('[WHEN] user try to add a backtesting strategy', () => {
    it('[THEN] it should return HTTP400 and error response body', async () => {
      const body = { ...mockValidAddBtStrategyRequestBody(), invalid: 'invalid' };
      const { response } = await addBtStrategy(body);

      expectHttpStatus(response, 400);
      expect(response.data).toEqual(toBeHttpErrorResponse);
    });
  });
});
