import { faker } from '@faker-js/faker';
import eUtils from 'fp-ts-std/Either';
import te from 'fp-ts/lib/TaskEither.js';
import { pick } from 'ramda';

import { buildHttpServer } from '#infra/http/server.js';
import { createMainLogger } from '#infra/logging.js';
import { mockSymbol } from '#test-utils/mockEntity.js';
import { mockSymbolRepository } from '#test-utils/mockRepository.js';
import { addRoute } from '#test-utils/mockServer.js';

import { SYMBOLS_ENDPOINTS } from '../routes.constant.js';
import { GetAllSymbolsError } from '../symbol.repository.type.js';
import { buildGetSymbolsController } from './getSymbols.js';

const { method, url } = SYMBOLS_ENDPOINTS.GET_SYMBOLS;
const logger = createMainLogger();

function setupNoSymbol() {
  const httpServer = eUtils.unsafeUnwrap(buildHttpServer(logger));
  const symbolRepository = mockSymbolRepository({ getAll: jest.fn(te.right([])) });
  const handler = buildGetSymbolsController({ symbolRepository });

  addRoute(httpServer, { method, url, handler });

  return httpServer;
}
function setupExistingSymbols() {
  const httpServer = eUtils.unsafeUnwrap(buildHttpServer(logger));
  const symbols = faker.helpers.multiple(mockSymbol, { count: 2 });
  const symbolRepository = mockSymbolRepository({ getAll: jest.fn(te.right(symbols)) });
  const handler = buildGetSymbolsController({ symbolRepository });

  addRoute(httpServer, { method, url, handler });

  return { httpServer, symbols };
}
function setupGettingFail() {
  const httpServer = eUtils.unsafeUnwrap(buildHttpServer(logger));
  const symbolRepository = mockSymbolRepository({
    getAll: jest.fn(te.left(new GetAllSymbolsError('GET_ALL_SYMBOLS_ERROR', 'Mock error'))),
  });
  const handler = buildGetSymbolsController({ symbolRepository });

  addRoute(httpServer, { method, url, handler });

  return httpServer;
}

describe('GIVEN there is no existing symbol WHEN get symbols', () => {
  it('THEN it should return HTTP200 and empty array', async () => {
    const httpServer = setupNoSymbol();

    const resp = await httpServer.inject({ method, url });
    const respBody = resp.json();

    expect(resp.statusCode).toBe(200);
    expect(respBody).toBeArrayOfSize(0);
  });
});

describe('GIVEN there is an existing symbol WHEN get symbols', () => {
  it('THEN it should return HTTP200 and an array of the existing symbols', async () => {
    const { httpServer, symbols } = setupExistingSymbols();

    const resp = await httpServer.inject({ method, url });
    const respBody = resp.json();

    expect(resp.statusCode).toBe(200);
    expect(respBody).toIncludeAllMembers(symbols.map(pick(['name', 'exchange', 'baseAsset', 'quoteAsset'])));
  });
});

describe('WHEN getting symbols fails', () => {
  it('THEN it should return HTTP500 with error response', async () => {
    const httpServer = setupGettingFail();

    const resp = await httpServer.inject({ method, url });
    const respBody = resp.json();

    expect(resp.statusCode).toBe(500);
    expect(respBody).toEqual({
      name: expect.any(String),
      message: expect.any(String),
      causes: expect.any(Array),
    });
  });
});
