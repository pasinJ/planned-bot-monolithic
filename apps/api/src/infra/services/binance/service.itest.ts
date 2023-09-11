import te from 'fp-ts/lib/TaskEither.js';
import { pipe } from 'fp-ts/lib/function.js';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { createMainLogger } from '#infra/logging.js';
import { getBnbConfig } from '#shared/config/binance.js';
import { executeT } from '#shared/utils/fp.js';
import exchangeInfoResp from '#test-utils/exchangeInfo.resp.json';
import { mockSymbolRepo } from '#test-utils/features/symbols/repositories.js';
import { mockDateService } from '#test-utils/services.js';

import { BNB_ENDPOINT_PATHS } from './constants.js';
import { isBnbServiceError } from './error.js';
import { createBnbService as createBnbServiceOrg } from './service.js';

const { HTTP_BASE_URL } = getBnbConfig();
const { ping, exchangeInfo } = BNB_ENDPOINT_PATHS;
const pingPath = `${HTTP_BASE_URL}${ping}`;

const msw = setupServer(rest.get(pingPath, (_, res, ctx) => res(ctx.status(200), ctx.json({}))));

function createBnbService() {
  const createServiceDeps = {
    dateService: mockDateService(),
    symbolRepo: mockSymbolRepo(),
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
    it('THEN it should return Left of Binance service error', async () => {
      msw.use(rest.get(pingPath, (_, res, ctx) => res(ctx.status(500))));

      const result = await executeT(createBnbService());
      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
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

      expect(result).toEqualRight([
        {
          id: expect.toBeString(),
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
      ]);
    });
  });
  describe('WHEN unsuccessfully get SPOT symbols (error response)', () => {
    it('THEN it should return Left of Binance service error', async () => {
      msw.use(rest.get(exchangeInfoPath, (_, res, ctx) => res(ctx.status(500))));

      const result = await pipe(
        createBnbService(),
        te.chainW((service) => service.getSpotSymbols),
        executeT,
      );
      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
});
