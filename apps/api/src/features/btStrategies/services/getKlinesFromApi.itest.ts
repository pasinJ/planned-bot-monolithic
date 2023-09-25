import { addMinutes, getTime } from 'date-fns';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { repeat } from 'ramda';

import { exchangeNameEnum } from '#features/shared/domain/exchange.js';
import { getBnbConfig } from '#infra/services/binance/config.js';
import { BNB_ENDPOINTS } from '#infra/services/binance/constants.js';
import { isBnbServiceError } from '#infra/services/binance/error.js';
import { buildBnbService } from '#infra/services/binance/service.js';
import { DateRange } from '#shared/utils/date.js';
import { executeIo, executeT, unsafeUnwrapEitherRight } from '#shared/utils/fp.js';
import { randomDate } from '#test-utils/faker/date.js';
import { randomTimeframe } from '#test-utils/features/shared/domain.js';
import { randomSymbolName } from '#test-utils/features/symbols/models.js';
import { mockMainLogger } from '#test-utils/services.js';

import { GetKlinesFromApiRequest, getKlinesFromApi } from './getKlinesFromApi.js';

function createRequest(overrides?: Partial<GetKlinesFromApiRequest>): GetKlinesFromApiRequest {
  return {
    symbol: randomSymbolName(),
    timeframe: randomTimeframe(),
    dateRange: createDateRange(),
    ...overrides,
  };
}
function createDateRange(minsDiff = 3): DateRange {
  const start = randomDate();
  return { start, end: addMinutes(start, minsDiff - 1) } as DateRange;
}

const { HTTP_BASE_URL } = getBnbConfig();
const { KLINES } = BNB_ENDPOINTS;
const klinesPath = `${HTTP_BASE_URL}${KLINES}`;
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
const bnbService = unsafeUnwrapEitherRight(executeIo(buildBnbService({ mainLogger: mockMainLogger() })));

beforeAll(() => msw.listen());
afterEach(() => msw.resetHandlers());
afterAll(() => msw.close());

describe('[WHEN] get klines from API', () => {
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

    const request = createRequest();

    await executeT(bnbService.composeWith(getKlinesFromApi)(request));

    expect(params).toHaveProperty('symbol', request.symbol);
    expect(params).toHaveProperty('interval', request.timeframe);
    expect(params).toHaveProperty('startTime', getTime(request.dateRange.start));
    expect(params).toHaveProperty('endTime', getTime(request.dateRange.end));
    expect(params).toHaveProperty('limit', 1000);
  });
});

describe('[WHEN] get klines from API [AND] server return less than 1000 klines', () => {
  const request = createRequest({
    dateRange: { start: new Date('2023-09-16'), end: new Date('2023-09-17') } as DateRange,
  });

  it('[THEN] it will not continue calling Binance server', async () => {
    let numCalls = 0;
    const length = 5;
    msw.use(
      rest.get(klinesPath, (_, res, ctx) => {
        numCalls += 1;
        return res(ctx.status(200), ctx.json(repeat(kline, length)));
      }),
    );

    await executeT(bnbService.composeWith(getKlinesFromApi)(request));

    expect(numCalls).toBe(1);
  });
  it('[THEN] it will return Right of kline models array from Binance server', async () => {
    const length = 5;
    msw.use(rest.get(klinesPath, (_, res, ctx) => res(ctx.status(200), ctx.json(repeat(kline, length)))));

    const result = await executeT(bnbService.composeWith(getKlinesFromApi)(request));

    expect(result).toEqualRight(repeat(klineModel(request.symbol, request.timeframe), length));
  });
});

describe('[WHEN] get klines from API [AND] server return 1000 klines and the end timestamp of the last kline is before the end of date range', () => {
  const request = createRequest({
    dateRange: { start: new Date('2023-09-16'), end: new Date('2023-09-18') } as DateRange,
  });

  it('[THEN] it will call Binance server again with end timestamp of the last kline as start time params', async () => {
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

    await executeT(bnbService.composeWith(getKlinesFromApi)(request));

    expect(numCalls).toBe(2);
    expect(params).toHaveProperty('symbol', request.symbol);
    expect(params).toHaveProperty('interval', request.timeframe);
    expect(params).toHaveProperty('startTime', kline[6]);
    expect(params).toHaveProperty('endTime', getTime(request.dateRange.end));
    expect(params).toHaveProperty('limit', 1000);
  });
  it('[THEN] it will return Right of kline models array from both requests', async () => {
    let numCalls = 0;
    const length = 5;
    msw.use(
      rest.get(klinesPath, (_, res, ctx) => {
        numCalls += 1;
        if (numCalls === 1) {
          return res(ctx.status(200), ctx.json(repeat(kline, 1000)));
        } else {
          return res(ctx.status(200), ctx.json(repeat(kline, length)));
        }
      }),
    );

    const result = await executeT(bnbService.composeWith(getKlinesFromApi)(request));

    expect(result).toEqualRight(repeat(klineModel(request.symbol, request.timeframe), 1000 + length));
  });
});

describe('[WHEN] get klines from API [AND] server return an empty array', () => {
  it('[THEN] it will not continue calling Binance server', async () => {
    let numCalls = 0;
    msw.use(
      rest.get(klinesPath, (req, res, ctx) => {
        numCalls += 1;
        return res(ctx.status(200), ctx.json([]));
      }),
    );

    await executeT(bnbService.composeWith(getKlinesFromApi)(createRequest()));

    expect(numCalls).toBe(1);
  });
  it('[THEN] it will return Right of am empty array', async () => {
    msw.use(rest.get(klinesPath, (_, res, ctx) => res(ctx.status(200), ctx.json([]))));

    const result = await executeT(bnbService.composeWith(getKlinesFromApi)(createRequest()));

    expect(result).toEqualRight([]);
  });
});

describe('[WHEN] get klines from API [BUT] server return Http error', () => {
  it('[THEN] it will return Left of error', async () => {
    msw.use(rest.get(klinesPath, (_, res, ctx) => res(ctx.status(500))));

    const result = await executeT(bnbService.composeWith(getKlinesFromApi)(createRequest()));

    expect(result).toEqualLeft(expect.toSatisfy(isBnbServiceError));
  });
});
