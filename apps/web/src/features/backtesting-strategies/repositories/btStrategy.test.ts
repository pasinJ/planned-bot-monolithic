import { setupServer } from 'msw/node';
import { omit } from 'ramda';

import { createAxiosHttpClient } from '#infra/axiosHttpClient';
import { executeT } from '#shared/utils/fp';
import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { addRestRoute, createApiPath } from '#test-utils/msw';

import { createBtStrategyRepo } from './btStrategy';
import { API_ENDPOINTS } from './btStrategy.constant';
import { isBtStrategyRepoError } from './btStrategy.error';

const { GET_BT_STRATEGIES, ADD_BT_STRATEGY } = API_ENDPOINTS;
const server = setupServer();
const httpClient = createAxiosHttpClient();

afterEach(() => jest.clearAllMocks());
beforeAll(() => server.listen());
afterAll(() => server.close());

describe('Create backtesting strategy repository', () => {
  describe('WHEN create a backtesting strategy repository', () => {
    it('THEN it should return backtesting strategy repository', () => {
      const repository = createBtStrategyRepo({ httpClient });
      expect(repository).toContainAllKeys(['getBtStrategies', 'addBtStrategy']);
    });
  });
});

describe('Get backtesting strategies', () => {
  const { method, url, responseSchema } = GET_BT_STRATEGIES;

  describe('WHEN get backtesting strategies', () => {
    it('THEN it should send request with configured method, path, and response schema', async () => {
      server.use(
        addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(200), ctx.json([]))),
      );

      const sendRequestSpy = jest.spyOn(httpClient, 'sendRequest');
      const repository = createBtStrategyRepo({ httpClient });
      await executeT(repository.getBtStrategies);

      expect(sendRequestSpy).toHaveBeenCalledWith({ method, url, responseSchema });
    });
  });
  describe('WHEN external system return valid success response', () => {
    it('THEN it should return Right of the response', async () => {
      const strategies = generateArrayOf(mockBtStrategy);
      server.use(
        addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(200), ctx.json(strategies))),
      );

      const repository = createBtStrategyRepo({ httpClient });
      const result = await executeT(repository.getBtStrategies);

      expect(result).toEqualRight(strategies);
    });
  });
  describe('WHEN external system return Http error', () => {
    it('THEN it should return Left of backtesting strategy error', async () => {
      server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));

      const repository = createBtStrategyRepo({ httpClient });
      const result = await executeT(repository.getBtStrategies);

      expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
    });
  });
});

describe('Add backtesting strategy', () => {
  const { method, url, responseSchema } = ADD_BT_STRATEGY;
  function mockData() {
    return omit(['id', 'version', 'createdAt', 'updatedAt'], mockBtStrategy());
  }

  describe('WHEN add backtesting strategy', () => {
    it('THEN it should send request with given data and the configured method, path, and response schema', async () => {
      server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(201))));

      const sendRequestSpy = jest.spyOn(httpClient, 'sendRequest');
      const repository = createBtStrategyRepo({ httpClient });
      const data = mockData();
      await executeT(repository.addBtStrategy(data));

      expect(sendRequestSpy).toHaveBeenCalledWith({ body: data, method, url, responseSchema });
    });
  });
  describe('WHEN external system return success response', () => {
    it('THEN it should return Right of undefined', async () => {
      server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(201))));

      const repository = createBtStrategyRepo({ httpClient });
      const result = await executeT(repository.addBtStrategy(mockData()));

      expect(result).toEqualRight(undefined);
    });
  });
  describe('WHEN external system return Http error', () => {
    it('THEN it should return Left of backtesting strategy error', async () => {
      server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));

      const repository = createBtStrategyRepo({ httpClient });
      const result = await executeT(repository.addBtStrategy(mockData()));

      expect(result).toEqualLeft(expect.toSatisfy(isBtStrategyRepoError));
    });
  });
});
