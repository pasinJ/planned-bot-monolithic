import * as te from 'fp-ts/lib/TaskEither';
import { setupServer } from 'msw/node';
import { is, omit } from 'ramda';

import { createAxiosHttpClient } from '#infra/axiosHttpClient';
import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { addRestRoute, createApiPath } from '#test-utils/msw';
import { executeT } from '#utils/fp';

import { addBtStrategy, getBtStrategies } from './btStrategy';
import { API_ENDPOINTS } from './btStrategy.constant';
import { AddBtStrategyError, GetBtStrategiesError } from './btStrategy.type';

const { GET_BT_STRATEGIES, ADD_BT_STRATEGY } = API_ENDPOINTS;
const server = setupServer();
const realHttpClient = createAxiosHttpClient();

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('Get backtesting strategies', () => {
  describe('WHEN get backtesting strategies', () => {
    it('THEN it should send request with configured method, path, and response schema', async () => {
      const { method, url, responseSchema } = GET_BT_STRATEGIES;
      const httpClient = { sendRequest: jest.fn().mockReturnValue(te.right([])) };
      server.use(
        addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(200), ctx.json([]))),
      );

      await executeT(getBtStrategies({ httpClient }));

      expect(httpClient.sendRequest).toHaveBeenCalledExactlyOnceWith({ method, url, responseSchema });
    });
  });
  describe('WHEN external system return valid success response', () => {
    it('THEN it should return Right of the response', async () => {
      const { method, url } = GET_BT_STRATEGIES;
      const strategies = generateArrayOf(mockBtStrategy);
      server.use(
        addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(200), ctx.json(strategies))),
      );

      const result = await executeT(getBtStrategies({ httpClient: realHttpClient }));

      expect(result).toEqualRight(strategies);
    });
  });
  describe('WHEN external system return Http error', () => {
    it('THEN it should return Left of error', async () => {
      const { method, url } = GET_BT_STRATEGIES;
      server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));

      const result = await executeT(getBtStrategies({ httpClient: realHttpClient }));

      expect(result).toEqualLeft(expect.toSatisfy(is(GetBtStrategiesError)));
    });
  });
});

describe('Add backtesting strategy', () => {
  function mockData() {
    return omit(['id', 'version', 'createdAt', 'updatedAt'], mockBtStrategy());
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
  describe('WHEN external system return success response', () => {
    it('THEN it should return Right of the response', async () => {
      const { method, url } = ADD_BT_STRATEGY;
      const strategy = mockBtStrategy();
      server.use(
        addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(200), ctx.json(strategy))),
      );

      const result = await executeT(addBtStrategy(mockData(), { httpClient: realHttpClient }));

      expect(result).toEqualRight(strategy);
    });
  });
  describe('WHEN external system return Http error', () => {
    it('THEN it should return Left of error', async () => {
      const { method, url } = ADD_BT_STRATEGY;
      server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));

      const result = await executeT(addBtStrategy(mockData(), { httpClient: realHttpClient }));

      expect(result).toEqualLeft(expect.toSatisfy(is(AddBtStrategyError)));
    });
  });
});
