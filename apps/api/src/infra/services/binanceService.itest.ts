import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { createMainLogger } from '#infra/logging.js';
import { getBnbConfig } from '#shared/config/binance.js';
import { executeT } from '#shared/utils/fp.js';
import exchangeInfoResp from '#test-utils/exchangeInfo.resp.json';
import { mockDateService, mockIdService } from '#test-utils/mockService.js';

import { BNB_PATHS } from './binanceService.constant.js';
import { createBnbService as createBnbServiceOrg } from './binanceService.js';

const { HTTP_BASE_URL } = getBnbConfig();
const { ping, exchangeInfo } = BNB_PATHS;
const pingPath = `${HTTP_BASE_URL}${ping}`;

const msw = setupServer(rest.get(pingPath, (_, res, ctx) => res(ctx.status(200), ctx.json({}))));

function createBnbService() {
  const createServiceDeps = {
    dateService: mockDateService(),
    idService: mockIdService(),
    mainLogger: createMainLogger(),
  };
  return createBnbServiceOrg(createServiceDeps);
}

beforeAll(() => msw.listen());
afterEach(() => msw.resetHandlers());
afterAll(() => msw.close());

describe('Create Binance service', () => {
  describe('WHEN successfully create Binance service', () => {
    it('THEN it should return Right of Binance service', async () => {
      const result = await executeT(createBnbService());
      expect(result).toEqualRight(expect.toContainAllKeys(['getSpotSymbols']));
    });
  });
  describe('WHEN unsuccessfully create Binance service (test connection failed)', () => {
    it('THEN it should return Left of CREATE_BNB_SERVICE_ERROR', async () => {
      msw.use(rest.get(pingPath, (_, res, ctx) => res(ctx.status(500))));

      const result = await executeT(createBnbService());
      expect(result).toSubsetEqualLeft({ name: 'CREATE_BNB_SERVICE_ERROR' });
    });
  });
});

describe('Get SPOT symbols', () => {
  const exchangeInfoPath = `${HTTP_BASE_URL}${exchangeInfo}`;

  describe('WHEN successfully get SPOT symbols', () => {
    it('THEN it should return Right of a list of symbols', async () => {
      msw.use(rest.get(exchangeInfoPath, (_, res, ctx) => res(ctx.status(200), ctx.json(exchangeInfoResp))));

      const result = await pipe(
        createBnbService(),
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
              minQty: 0,
              maxQty: 100000.0,
              stepSize: 0.0001,
            },
            {
              type: 'MARKET_LOT_SIZE',
              minQty: 0.001,
              maxQty: 100000.0,
              stepSize: 0,
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
        createBnbService(),
        te.chainW((service) => service.getSpotSymbols),
        executeT,
      );
      expect(result).toSubsetEqualLeft({ name: 'GET_BNB_SPOT_SYMBOLS_ERROR' });
    });
  });
});
