import * as te from 'fp-ts/lib/TaskEither';
import { setupServer } from 'msw/node';
import { is } from 'ramda';

import { createAxiosHttpClient } from '#infra/axiosHttpClient';
import { generateArrayOf } from '#test-utils/faker';
import { mockSymbol } from '#test-utils/features/symbols/valueObjects';
import { addRestRoute, createApiPath } from '#test-utils/msw';
import { executeT } from '#utils/fp';

import { getSymbols } from './symbol';
import { API_ENDPOINTS } from './symbol.constant';
import { GetSymbolsError } from './symbol.type';

const { GET_SYMBOLS } = API_ENDPOINTS;
const server = setupServer();
const realHttpClient = createAxiosHttpClient();

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('Get symbols', () => {
  describe('WHEN try to get symbols', () => {
    it('THEN it should send request to backend with configured method, path, and response schema', async () => {
      const { method, url, responseSchema } = GET_SYMBOLS;
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([])) };

      await executeT(getSymbols({ httpClient }));

      expect(httpClient.sendRequest).toHaveBeenCalledExactlyOnceWith({ method, url, responseSchema });
    });
  });
  describe('WHEN external system return valid success response', () => {
    it('THEN it should return Right of the response', async () => {
      const { method, url } = GET_SYMBOLS;
      const symbols = generateArrayOf(mockSymbol);
      server.use(
        addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(200), ctx.json(symbols))),
      );

      const result = await executeT(getSymbols({ httpClient: realHttpClient }));

      expect(result).toEqualRight(symbols);
    });
  });
  describe('WHEN external system return Http error', () => {
    it('THEN it should return Left of error', async () => {
      const { method, url } = GET_SYMBOLS;
      server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));

      const result = await executeT(getSymbols({ httpClient: realHttpClient }));

      expect(result).toEqualLeft(expect.toSatisfy(is(GetSymbolsError)));
    });
  });
});
