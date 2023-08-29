import * as te from 'fp-ts/lib/TaskEither';
import { is } from 'ramda';

import { HttpError } from '#infra/httpClient.type';
import { mockSymbol } from '#test-utils/mockValueObject';
import { executeT } from '#utils/fp';

import { getSymbols } from './symbol';
import { API_ENDPOINTS } from './symbol.constant';
import { GetSymbolsError } from './symbol.type';

const { GET_SYMBOLS } = API_ENDPOINTS;

describe('Get symbols', () => {
  describe('WHEN try to get symbols', () => {
    it('THEN it should send request to backend with configured method, path, and response schema', async () => {
      const { method, url, responseSchema } = GET_SYMBOLS;
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([])) };

      await executeT(getSymbols({ httpClient }));

      expect(httpClient.sendRequest).toHaveBeenCalledExactlyOnceWith({ method, url, responseSchema });
    });
  });
  describe('WHEN HTTP client return valid success response', () => {
    it('THEN it should return Right of the response', async () => {
      const symbol = mockSymbol();
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([symbol])) };

      const result = await executeT(getSymbols({ httpClient }));

      expect(result).toEqualRight([symbol]);
    });
  });
  describe('WHEN HTTP client return Http error', () => {
    it('THEN it should return Left of error', async () => {
      const httpClient = {
        sendRequest: jest.fn().mockReturnValue(te.left(new HttpError('INTERNAL_SERVER_ERROR', 'Mock error'))),
      };

      const result = await executeT(getSymbols({ httpClient }));

      expect(result).toEqualLeft(expect.toSatisfy(is(GetSymbolsError)));
    });
  });
});
