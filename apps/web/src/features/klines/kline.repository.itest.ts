import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { exchangeNameEnum } from '#features/exchanges/domain/exchange';
import { SymbolName } from '#features/symbols/domain/symbol';
import { createAxiosHttpClient } from '#infra/axiosHttpClient';
import { API_BASE_URL } from '#infra/httpClient.constant';
import { timeframeEnum } from '#shared/domain/timeframe';
import { ValidDate } from '#shared/utils/date';
import { executeT } from '#shared/utils/fp';
import { generateArrayOf } from '#test-utils/faker';
import { mockKline } from '#test-utils/features/klines/kline';

import { API_ENDPOINTS } from './kline.constant';
import { GetKlinesRequest, createKlineRepo } from './kline.repository';
import { isKlineRepoError } from './kline.repository.error';

const getKlinesUrl = API_BASE_URL + API_ENDPOINTS.GET_KLINES.url;
const httpClient = createAxiosHttpClient();
const klineRepo = createKlineRepo({ httpClient });
const request: GetKlinesRequest = {
  exchange: exchangeNameEnum.BINANCE,
  symbol: 'BTCUSDT' as SymbolName,
  timeframe: timeframeEnum['1d'],
  startTimestamp: new Date('2022-10-01') as ValidDate,
  endTimestamp: new Date('2022-10-02') as ValidDate,
};
const server = setupServer();

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('[WHEN] get klines', () => {
  it('[THEN] it will send a request to server with correct params', async () => {
    let params: URLSearchParams = new URLSearchParams();
    server.use(
      rest.get(getKlinesUrl, (req, res, ctx) => {
        params = req.url.searchParams;
        return res(ctx.status(200), ctx.json([]));
      }),
    );

    await executeT(klineRepo.getKlines(request));

    expect(params.get('exchange')).toEqual(request.exchange);
    expect(params.get('symbol')).toEqual(request.symbol);
    expect(params.get('startTimestamp')).toEqual(request.startTimestamp.toISOString());
    expect(params.get('endTimestamp')).toEqual(request.endTimestamp.toISOString());
  });
});

describe('[GIVEN] the server return HTTP error', () => {
  describe('[WHEN] get klines', () => {
    it('[THEN] it will return Left of error', async () => {
      server.use(rest.get(getKlinesUrl, (_, res, ctx) => res(ctx.status(500))));

      const result = await executeT(klineRepo.getKlines(request));

      expect(result).toEqualLeft(expect.toSatisfy(isKlineRepoError));
    });
  });
});

describe('[GIVEN] the server return successful response', () => {
  describe('[WHEN] get klines', () => {
    it('[THEN] it will return Right of a list of klines', async () => {
      const klines = generateArrayOf(mockKline, 3);
      server.use(rest.get(getKlinesUrl, (_, res, ctx) => res(ctx.status(200), ctx.json(klines))));

      const result = await executeT(klineRepo.getKlines(request));

      expect(result).toEqualRight(klines);
    });
  });
});
