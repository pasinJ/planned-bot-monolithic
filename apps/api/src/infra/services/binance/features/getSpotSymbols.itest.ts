import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import exchangeInfoResp from '#test-utils/exchangeInfo.resp.json';
import { mockMainLogger } from '#test-utils/services.js';

import { getBnbConfig } from '../config.js';
import { BNB_ENDPOINTS } from '../constants.js';
import { isBnbServiceError } from '../error.js';
import { buildBnbService } from '../service.js';
import { getSpotSymbolsList } from './getSpotSymbols.js';

const { HTTP_BASE_URL } = getBnbConfig();
const { exchangeInfo } = BNB_ENDPOINTS;
const exchangeInfoPath = `${HTTP_BASE_URL}${exchangeInfo}`;
const bnbService = unsafeUnwrapEitherRight(executeIo(buildBnbService({ mainLogger: mockMainLogger() })));
const getSpotSymbolsListFn = bnbService.composeWith(getSpotSymbolsList);

const msw = setupServer();

beforeAll(() => msw.listen());
afterEach(() => msw.resetHandlers());
afterAll(() => msw.close());

describe('Get list of SPOT symbols information', () => {
  describe('WHEN successfully get SPOT symbols', () => {
    it('THEN it should return Right of a list of symbols', async () => {
      msw.use(rest.get(exchangeInfoPath, (_, res, ctx) => res(ctx.status(200), ctx.json(exchangeInfoResp))));

      const result = await executeT(getSpotSymbolsListFn);

      expect(result).toEqualRight([
        {
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
        },
      ]);
    });
  });
  describe('WHEN unsuccessfully get SPOT symbols (error response)', () => {
    it('THEN it should return Left of Binance service error', async () => {
      msw.use(rest.get(exchangeInfoPath, (_, res, ctx) => res(ctx.status(500))));

      const result = await executeT(getSpotSymbolsListFn);

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
});
