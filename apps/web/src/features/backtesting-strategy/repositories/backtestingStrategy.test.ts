import * as te from 'fp-ts/lib/TaskEither';
import { is } from 'ramda';

import { HttpError } from '#infra/httpClient.type';
import { mockBacktestingStrategy } from '#test-utils/mockEntity';
import { executeT } from '#utils/fpExecute';

import { getBacktestingStrategies } from './backtestingStrategy';
import { API_ENDPOINTS } from './backtestingStrategy.constant';
import { GetBacktestingStrategiesError } from './backtestingStrategy.type';

const { GET_BACKTESTING_STRATEGIES } = API_ENDPOINTS;

describe('Get backtesting strategies', () => {
  describe('WHEN try to get backtesting strategies', () => {
    it('THEN it should send request to backend with configured method, path, and response schema', async () => {
      const { method, url, responseSchema } = GET_BACKTESTING_STRATEGIES;
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([])) };

      await executeT(getBacktestingStrategies({ httpClient }));

      expect(httpClient.sendRequest).toHaveBeenCalledExactlyOnceWith({ method, url, responseSchema });
    });
  });
  describe('WHEN HTTP client return valid success response', () => {
    it('THEN it should return Right of the response', async () => {
      const strategy = mockBacktestingStrategy();
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([strategy])) };

      const result = await executeT(getBacktestingStrategies({ httpClient }));

      expect(result).toEqualRight([strategy]);
    });
  });
  describe('WHEN HTTP client return Http error', () => {
    it('THEN it should return Left of error', async () => {
      const httpClient = {
        sendRequest: jest.fn().mockReturnValue(te.left(new HttpError('INTERNAL_SERVER_ERROR', 'Mock error'))),
      };

      const result = await executeT(getBacktestingStrategies({ httpClient }));

      expect(result).toEqualLeft(expect.toSatisfy(is(GetBacktestingStrategiesError)));
    });
  });
});
