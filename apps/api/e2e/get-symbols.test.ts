import { faker } from '@faker-js/faker';
import { pick } from 'ramda';

import { SymbolModel, symbolModelName } from '#features/symbols/symbol.model.js';
import { createSymbolRepository } from '#features/symbols/symbol.repository.js';
import { executeIo } from '#shared/utils/fp.js';
import { mockSymbol } from '#test-utils/mockEntity.js';
import { createMongoClient } from '#test-utils/mockRepository.js';

import { expectHttpStatus } from './commands/expect.js';
import { getSymbols } from './commands/symbols.js';

const client = await createMongoClient();
executeIo(createSymbolRepository(client));
const symbolModel: SymbolModel = client.models[symbolModelName];

afterEach(() => symbolModel.deleteMany());
afterAll(() => client.disconnect());

describe('GIVEN there is no existing symbols WHEN get symbols', () => {
  it('THEN it should return HTTP200 and empty array', async () => {
    await symbolModel.deleteMany();

    const resp = await getSymbols();

    expectHttpStatus(resp, 200);
    expect(resp.data).toBeArrayOfSize(0);
  });
});

describe('GIVEN some symbols have been added WHEN get symbols', () => {
  it('THEN it should return HTTP200 and an array with the added symbols', async () => {
    const symbols = faker.helpers.multiple(mockSymbol, { count: 2 });
    await symbolModel.insertMany(symbols);

    const getResp = await getSymbols();

    expectHttpStatus(getResp, 200);
    expect(getResp.data).toBeArrayOfSize(symbols.length);
    expect(getResp.data).toIncludeAllMembers(
      symbols.map(pick(['name', 'exchange', 'baseAsset', 'quoteAsset'])),
    );
  });
});
