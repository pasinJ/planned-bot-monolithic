import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { pino } from 'pino';
import { mergeDeepRight } from 'ramda';

import { DeepPartial } from '#shared/common.type.js';
import { executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import exchangeInfoResp from '#test-utils/exchangeInfo.resp.json';
import { randomAnyDate, randomString } from '#test-utils/faker.js';

import { getBnbConfig } from '../config.js';
import { BNB_ENDPOINT_PATHS } from '../constants.js';
import { isBnbServiceError } from '../error.js';
import { BnbServiceDeps, createBnbService } from '../service.js';
import { BnbService } from '../service.type.js';

function mockDeps(overrides?: DeepPartial<BnbServiceDeps>): BnbServiceDeps {
  return mergeDeepRight(
    {
      symbolModelDao: { generateId: jest.fn().mockReturnValue(randomString()) },
      dateService: { getCurrentDate: jest.fn().mockReturnValue(randomAnyDate()) },
      mainLogger: pino({ enabled: false }),
    },
    overrides ?? {},
  ) as BnbServiceDeps;
}

const { HTTP_BASE_URL } = getBnbConfig();
const { ping, exchangeInfo } = BNB_ENDPOINT_PATHS;
const pingPath = `${HTTP_BASE_URL}${ping}`;
const exchangeInfoPath = `${HTTP_BASE_URL}${exchangeInfo}`;

const msw = setupServer(rest.get(pingPath, (_, res, ctx) => res(ctx.status(200), ctx.json({}))));

beforeAll(() => msw.listen());
afterEach(() => msw.resetHandlers());
afterAll(() => msw.close());

describe('Get SPOT symbols', () => {
  let service: BnbService;

  beforeAll(async () => {
    service = unsafeUnwrapEitherRight(await executeT(createBnbService(mockDeps())));
  });

  describe('WHEN successfully get SPOT symbols', () => {
    it('THEN it should return Right of a list of symbols', async () => {
      msw.use(rest.get(exchangeInfoPath, (_, res, ctx) => res(ctx.status(200), ctx.json(exchangeInfoResp))));

      const result = await executeT(service.getSpotSymbols);

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

      const result = await executeT(service.getSpotSymbols);

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
});
