import { pick } from 'ramda';

import {
  SymbolMongooseModel,
  createSymbolModelDao,
  symbolModelName,
} from '#features/symbols/data-models/symbol.dao.js';
import { executeIo } from '#shared/utils/fp.js';
import { generateArrayOf } from '#test-utils/faker.js';
import { mockSymbol } from '#test-utils/features/symbols/models.js';
import { createMongoClient } from '#test-utils/mongoDb.js';

import { expectHttpStatus } from './commands/expect.js';
import { getSymbols } from './commands/symbols.js';

const client = await createMongoClient();
executeIo(createSymbolModelDao(client));
const symbolModel: SymbolMongooseModel = client.models[symbolModelName];

afterEach(() => symbolModel.deleteMany());
afterAll(() => client.disconnect());

describe('GIVEN there is no existing symbols WHEN get symbols', () => {
  it('THEN it should return HTTP200 and empty array', async () => {
    const resp = await getSymbols();

    expectHttpStatus(resp, 200);
    expect(resp.data).toBeArrayOfSize(0);
  });
});

describe('GIVEN some symbols have been added WHEN get symbols', () => {
  it('THEN it should return HTTP200 and an array with the added symbols', async () => {
    const symbols = generateArrayOf(mockSymbol, 2);
    await symbolModel.insertMany(symbols);

    const getResp = await getSymbols();

    expectHttpStatus(getResp, 200);
    expect(getResp.data).toBeArrayOfSize(symbols.length);
    expect(getResp.data).toIncludeAllMembers(
      symbols.map(pick(['name', 'exchange', 'baseAsset', 'quoteAsset'])),
    );
  });
});
