import { setupServer } from 'msw/node';

import { createAxiosHttpClient } from '#infra/axiosHttpClient';
import { executeT } from '#shared/utils/fp';
import { generateArrayOf } from '#test-utils/faker';
import { mockSymbol } from '#test-utils/features/symbols/symbol';
import { addRestRoute, createApiPath } from '#test-utils/msw';

import { API_ENDPOINTS } from './endpoints';
import { createSymbolRepo } from './symbol.repository';
import { isSymbolRepoError } from './symbol.repository.error';

const server = setupServer();
const httpClient = createAxiosHttpClient();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UUT: Get symbols', () => {
  const { method, url } = API_ENDPOINTS.GET_SYMBOLS;
  const symbolRepo = createSymbolRepo({ httpClient });

  describe('[WHEN] get symbols', () => {
    it('[THEN] it will send a request to server', async () => {
      let serverHasBeenCalled = false;
      server.use(
        addRestRoute(method, createApiPath(url), (_, res, ctx) => {
          serverHasBeenCalled = true;
          return res(ctx.status(200), ctx.json([]));
        }),
      );

      await executeT(symbolRepo.getSymbols);

      expect(serverHasBeenCalled).toBe(true);
    });
  });

  describe('[GIVEN] the server return HTTP error', () => {
    describe('[WHEN] get symbols', () => {
      it('[THEN] it will return Left of error', async () => {
        server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));

        const result = await executeT(symbolRepo.getSymbols);

        expect(result).toEqualLeft(expect.toSatisfy(isSymbolRepoError));
      });
    });
  });

  describe('[GIVEN] the server return successful response', () => {
    describe('[WHEN] get symbols', () => {
      it('[THEN] it will return Right of a list of symbols', async () => {
        const symbols = generateArrayOf(mockSymbol, 3);
        server.use(
          addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(200), ctx.json(symbols))),
        );

        const result = await executeT(symbolRepo.getSymbols);

        expect(result).toEqualRight(symbols);
      });
    });
  });
});
