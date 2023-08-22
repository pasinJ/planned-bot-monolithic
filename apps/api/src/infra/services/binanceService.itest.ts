import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { createAxiosHttpClient } from '#infra/http/client.js';
import { executeT } from '#shared/utils/fp.js';
import exchangeInfoResp from '#test-utils/exchangeInfo.resp.json';
import { mockDateService, mockIdService } from '#test-utils/mockService.js';

import { createBnbService } from './binanceService.js';

const baseURL = 'https://api.binance.com';
const pingPath = `${baseURL}/api/v3/ping`;
const createServiceDeps = {
  httpClient: createAxiosHttpClient({ baseURL }),
  dateService: mockDateService(),
  idService: mockIdService(),
};
const msw = setupServer(rest.get(pingPath, (_, res, ctx) => res(ctx.status(200), ctx.json({}))));

beforeAll(() => msw.listen());
afterEach(() => msw.resetHandlers());
afterAll(() => msw.close());

describe('Create Binance service', () => {
  describe('WHEN successfully create Binance service', () => {
    it('THEN it should return Right of Binance service', async () => {
      const result = await executeT(createBnbService(createServiceDeps));
      expect(result).toEqualRight(expect.toContainAllKeys(['getSpotSymbols']));
    });
  });
  describe('WHEN unsuccessfully create Binance service (test connection failed)', () => {
    it('THEN it should return Left of CREATE_BNB_SERVICE_ERROR', async () => {
      msw.use(rest.get(pingPath, (_, res, ctx) => res(ctx.status(500))));

      const result = await executeT(createBnbService(createServiceDeps));
      expect(result).toSubsetEqualLeft({ name: 'CREATE_BNB_SERVICE_ERROR' });
    });
  });
});

describe('Get SPOT symbols', () => {
  const exchangeInfoPath = `${baseURL}/api/v3/exchangeInfo`;

  describe('WHEN successfully get SPOT symbols', () => {
    it('THEN it should return Right of a list of symbols', async () => {
      msw.use(rest.get(exchangeInfoPath, (_, res, ctx) => res(ctx.status(200), ctx.json(exchangeInfoResp))));

      const result = await pipe(
        createBnbService(createServiceDeps),
        te.chainW((service) => service.getSpotSymbols),
        executeT,
      );

      const expected = [
        {
          id: expect.any(String),
          name: 'ETHBTC',
          exchange: 'BINANCE',
          baseAsset: 'ETH',
          baseAssetPrecision: 8,
          quoteAsset: 'BTC',
          quoteAssetPrecision: 8,
          orderTypes: ['LIMIT', 'LIMIT_MAKER', 'MARKET', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT_LIMIT'],
          filters: [
            {
              type: 'PRICE_FILTER',
              minPrice: 0.00001,
              maxPrice: 922327.0,
              tickSize: 0.00001,
            },
            {
              type: 'LOT_SIZE',
              minQty: 0.0001,
              maxQty: 100000.0,
              stepSize: 0.0001,
            },
          ],
          version: 0,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ];
      expect(result).toEqualRight(expected);
    });
  });
  describe('WHEN unsuccessfully get SPOT symbols (error response)', () => {
    it('THEN it should return Left of GET_BNB_SPOT_SYMBOLS_ERROR', async () => {
      msw.use(rest.get(exchangeInfoPath, (_, res, ctx) => res(ctx.status(500))));

      const result = await pipe(
        createBnbService(createServiceDeps),
        te.chainW((service) => service.getSpotSymbols),
        executeT,
      );
      expect(result).toSubsetEqualLeft({ name: 'GET_BNB_SPOT_SYMBOLS_ERROR' });
    });
  });
});
