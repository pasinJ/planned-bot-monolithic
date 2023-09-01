import te from 'fp-ts/lib/TaskEither.js';
import { pick } from 'ramda';

import { toBeHttpErrorResponse } from '#test-utils/expect.js';
import { generateArrayOf } from '#test-utils/faker.js';
import { mockSymbol } from '#test-utils/features/symbols/entities.js';
import { mockSymbolRepo } from '#test-utils/features/symbols/repositories.js';
import { setupTestServer } from '#test-utils/httpServer.js';

import { SYMBOLS_ENDPOINTS } from '../routes.constant.js';
import { GetAllSymbolsError } from '../symbol.repository.type.js';
import { GetSymbolsControllerDeps, buildGetSymbolsController } from './getSymbols.js';

const { method, url } = SYMBOLS_ENDPOINTS.GET_SYMBOLS;
const setupServer = setupTestServer(method, url, buildGetSymbolsController, mockDeps);

function mockDeps(overrides?: Partial<GetSymbolsControllerDeps>): GetSymbolsControllerDeps {
  return { symbolRepo: mockSymbolRepo(), ...overrides };
}
function setupNoSymbol() {
  const symbolRepo = mockSymbolRepo({ getAll: jest.fn(te.right([])) });
  return setupServer({ symbolRepo });
}
function setupExistingSymbols() {
  const symbols = generateArrayOf(mockSymbol);
  const symbolRepo = mockSymbolRepo({ getAll: jest.fn(te.right(symbols)) });

  return { httpServer: setupServer({ symbolRepo }), symbols };
}
function setupRepoError() {
  const symbolRepo = mockSymbolRepo({ getAll: jest.fn(te.left(new GetAllSymbolsError())) });
  return setupServer({ symbolRepo });
}

describe('GIVEN there is no existing symbol WHEN get symbols', () => {
  it('THEN it should return HTTP200 and empty array', async () => {
    const httpServer = setupNoSymbol();

    const resp = await httpServer.inject({ method, url });

    expect(resp.statusCode).toBe(200);
    expect(resp.json()).toBeArrayOfSize(0);
  });
});

describe('GIVEN there is an existing symbol WHEN get symbols', () => {
  it('THEN it should return HTTP200 and an array of the existing symbols', async () => {
    const { httpServer, symbols } = setupExistingSymbols();

    const resp = await httpServer.inject({ method, url });

    expect(resp.statusCode).toBe(200);
    expect(resp.json()).toIncludeAllMembers(
      symbols.map(pick(['name', 'exchange', 'baseAsset', 'quoteAsset'])),
    );
  });
});

describe('WHEN getting symbols fails', () => {
  it('THEN it should return HTTP500 with error response', async () => {
    const httpServer = setupRepoError();

    const resp = await httpServer.inject({ method, url });

    expect(resp.statusCode).toBe(500);
    expect(resp.json()).toEqual(toBeHttpErrorResponse);
  });
});
