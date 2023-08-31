import * as te from 'fp-ts/lib/TaskEither';
import { is, omit } from 'ramda';

import { HttpError } from '#infra/httpClient.type';
import { mockBacktestingStrategy } from '#test-utils/mockEntity';
import { executeT } from '#utils/fp';

import { addBtStrategy, getBtStrategies } from './backtestingStrategy';
import { API_ENDPOINTS } from './backtestingStrategy.constant';
import { AddBtStrategyError, GetBtStrategiesError } from './backtestingStrategy.type';

const { GET_BT_STRATEGIES, ADD_BT_STRATEGY } = API_ENDPOINTS;

describe('Get backtesting strategies', () => {
  describe('WHEN get backtesting strategies', () => {
    it('THEN it should send request with configured method, path, and response schema', async () => {
      const { method, url, responseSchema } = GET_BT_STRATEGIES;
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([])) };

      await executeT(getBtStrategies({ httpClient }));

      expect(httpClient.sendRequest).toHaveBeenCalledExactlyOnceWith({ method, url, responseSchema });
    });
  });
  describe('WHEN HTTP client return valid success response', () => {
    it('THEN it should return Right of the response', async () => {
      const strategy = mockBacktestingStrategy();
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([strategy])) };

      const result = await executeT(getBtStrategies({ httpClient }));

      expect(result).toEqualRight([strategy]);
    });
  });
  describe('WHEN HTTP client return Http error', () => {
    it('THEN it should return Left of error', async () => {
      const httpClient = {
        sendRequest: jest.fn().mockReturnValue(te.left(new HttpError('INTERNAL_SERVER_ERROR', 'Mock error'))),
      };

      const result = await executeT(getBtStrategies({ httpClient }));

      expect(result).toEqualLeft(expect.toSatisfy(is(GetBtStrategiesError)));
    });
  });
});

describe('Add backtesting strategy', () => {
  function mockData() {
    return omit(['id', 'version', 'createdAt', 'updatedAt'], mockBacktestingStrategy());
  }

  describe('WHEN add backtesting strategy', () => {
    it('THEN it should send request with given data and the configured method, path, and response schema', async () => {
      const { method, url, responseSchema } = ADD_BT_STRATEGY;
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right(undefined)) };
      const data = mockData();

      await executeT(addBtStrategy(data, { httpClient }));

      expect(httpClient.sendRequest).toHaveBeenCalledExactlyOnceWith({
        body: data,
        method,
        url,
        responseSchema,
      });
    });
  });
  describe('WHEN HTTP client return success response', () => {
    it('THEN it should return Right of the response', async () => {
      const strategy = mockBacktestingStrategy();
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right(strategy)) };

      const result = await executeT(addBtStrategy(mockData(), { httpClient }));

      expect(result).toEqualRight(strategy);
    });
  });
  describe('WHEN HTTP client return Http error', () => {
    it('THEN it should return Left of error', async () => {
      const error = new HttpError('INTERNAL_SERVER_ERROR', 'Mock error');
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.left(error)) };

      const result = await executeT(addBtStrategy(mockData(), { httpClient }));

      expect(result).toEqualLeft(expect.toSatisfy(is(AddBtStrategyError)));
    });
  });
});
