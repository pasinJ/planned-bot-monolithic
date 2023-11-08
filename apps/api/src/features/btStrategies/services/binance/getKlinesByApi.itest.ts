import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { repeat } from 'ramda';

import { exchangeNameEnum } from '#features/shared/exchange.js';
import { SymbolName } from '#features/shared/symbol.js';
import { timeframeEnum } from '#features/shared/timeframe.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { BNB_ENDPOINTS } from '#infra/services/binance/constants.js';
import { isBnbServiceError } from '#infra/services/binance/error.js';
import { buildBnbService } from '#infra/services/binance/service.js';
import { DateRange } from '#shared/utils/date.js';
import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { mockMainLogger } from '#test-utils/services.js';

import { getKlinesByApi } from './getKlinesByApi.js';

const { HTTP_BASE_URL } = getBnbConfig();
const klinesPath = `${HTTP_BASE_URL}${BNB_ENDPOINTS.KLINES}`;
const msw = setupServer();

const kline = [
  1694935443000,
  '26545.37000000',
  '26545.37000000',
  '26545.37000000',
  '26545.37000000',
  '0.00000000',
  1694935443999,
  '0.00000000',
  0,
  '0.00000000',
  '0.00000000',
  '0',
];
const klineModel = (symbol: string, timeframe: string) => ({
  exchange: exchangeNameEnum.BINANCE,
  symbol,
  timeframe,
  openTimestamp: new Date(1694935443000),
  closeTimestamp: new Date(1694935443999),
  open: 26545.37,
  close: 26545.37,
  high: 26545.37,
  low: 26545.37,
  volume: 0.0,
  quoteAssetVolume: 0.0,
  takerBuyBaseAssetVolume: 0.0,
  takerBuyQuoteAssetVolume: 0.0,
  numTrades: 0,
});
const bnbService = unsafeUnwrapEitherRight(
  executeIo(buildBnbService({ mainLogger: mockMainLogger(), getBnbConfig })),
);
const getKlinesFn = bnbService.composeWith(getKlinesByApi);
const defaultRequest = {
  symbol: 'BTCUSDT' as SymbolName,
  timeframe: timeframeEnum['1d'],
  dateRange: { start: new Date('2023-09-16'), end: new Date('2023-09-18') } as DateRange,
};

beforeAll(() => msw.listen());
afterEach(() => msw.resetHandlers());
afterAll(() => msw.close());

describe('[WHEN] get klines by API', () => {
  it('[THEN] it will call Binance server with correct params', async () => {
    let params = {};
    msw.use(
      rest.get(klinesPath, (req, res, ctx) => {
        params = {
          symbol: req.url.searchParams.get('symbol'),
          interval: req.url.searchParams.get('interval'),
          startTime: Number(req.url.searchParams.get('startTime')),
          endTime: Number(req.url.searchParams.get('endTime')),
          limit: Number(req.url.searchParams.get('limit')),
        };

        return res(ctx.status(200), ctx.json([]));
      }),
    );

    const request = defaultRequest;

    await executeT(getKlinesFn(request));

    expect(params).toHaveProperty('symbol', request.symbol);
    expect(params).toHaveProperty('interval', request.timeframe);
    expect(params).toHaveProperty('startTime', request.dateRange.start.getTime());
    expect(params).toHaveProperty('endTime', request.dateRange.end.getTime());
    expect(params).toHaveProperty('limit', 1000);
  });
});

describe('[GIVEN] server returns less than 1000 klines', () => {
  const numOfReturnedKlines = 5;
  const request = defaultRequest;

  describe('[WHEN] get klines by API', () => {
    it('[THEN] it will not continue calling Binance server', async () => {
      let numCalls = 0;
      msw.use(
        rest.get(klinesPath, (_, res, ctx) => {
          numCalls += 1;
          return res(ctx.status(200), ctx.json(repeat(kline, numOfReturnedKlines)));
        }),
      );

      await executeT(getKlinesFn(request));

      expect(numCalls).toBe(1);
    });
    it('[THEN] it will return Right of kline models array from Binance server', async () => {
      msw.use(
        rest.get(klinesPath, (_, res, ctx) =>
          res(ctx.status(200), ctx.json(repeat(kline, numOfReturnedKlines))),
        ),
      );

      const result = await executeT(getKlinesFn(request));

      const expected = repeat(klineModel(request.symbol, request.timeframe), numOfReturnedKlines);
      expect(result).toEqualRight(expected);
    });
  });
});

describe('[GIVEN] server return 1000 klines and the end timestamp of the last kline is before the end of date range', () => {
  const request = {
    ...defaultRequest,
    dateRange: { start: new Date('2023-09-16'), end: new Date('2023-09-18') } as DateRange,
  };

  describe('[WHEN] get klines by API', () => {
    it('[THEN] it will call Binance server again with end timestamp of the last kline + 1 as start time params', async () => {
      let numCalls = 0;
      let params = {};
      msw.use(
        rest.get(klinesPath, (req, res, ctx) => {
          numCalls += 1;
          params = {
            symbol: req.url.searchParams.get('symbol'),
            interval: req.url.searchParams.get('interval'),
            startTime: Number(req.url.searchParams.get('startTime')),
            endTime: Number(req.url.searchParams.get('endTime')),
            limit: Number(req.url.searchParams.get('limit')),
          };

          if (numCalls === 1) {
            return res(ctx.status(200), ctx.json(repeat(kline, 1000)));
          } else {
            return res(ctx.status(200), ctx.json(repeat(kline, 5)));
          }
        }),
      );

      await executeT(getKlinesFn(request));

      expect(numCalls).toBe(2);
      expect(params).toHaveProperty('symbol', request.symbol);
      expect(params).toHaveProperty('interval', request.timeframe);
      expect(params).toHaveProperty('startTime', 1694935444000);
      expect(params).toHaveProperty('endTime', request.dateRange.end.getTime());
      expect(params).toHaveProperty('limit', 1000);
    });
    it('[THEN] it will return Right of kline models array from both requests', async () => {
      let numCalls = 0;
      msw.use(
        rest.get(klinesPath, (_, res, ctx) => {
          numCalls += 1;
          if (numCalls === 1) {
            return res(ctx.status(200), ctx.json(repeat(kline, 1000)));
          } else {
            return res(ctx.status(200), ctx.json(repeat(kline, 5)));
          }
        }),
      );

      const result = await executeT(bnbService.composeWith(getKlinesByApi)(request));

      const expected = repeat(klineModel(request.symbol, request.timeframe), 1005);
      expect(result).toEqualRight(expected);
    });
  });
});

describe('[GIVEN] server return Http error', () => {
  describe('[WHEN] get klines by API', () => {
    it('[THEN] it will return Left of error', async () => {
      msw.use(rest.get(klinesPath, (_, res, ctx) => res(ctx.status(500))));
      const request = defaultRequest;

      const result = await executeT(getKlinesFn(request));

      expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
    });
  });
});
