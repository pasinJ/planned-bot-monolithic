import { setupServer } from 'msw/node';

import { exchangeNameEnum } from '#features/exchanges/exchange';
import { timeframeEnum } from '#features/klines/kline';
import { SymbolName } from '#features/symbols/symbol';
import { createAxiosHttpClient } from '#infra/axiosHttpClient';
import { ValidDate } from '#shared/utils/date';
import { executeT } from '#shared/utils/fp';
import { generateArrayOf } from '#test-utils/faker';
import { mockKline } from '#test-utils/features/klines/kline';
import { addRestRoute, createApiPath } from '#test-utils/msw';

import { API_ENDPOINTS } from './endpoints';
import { GetKlinesRequest, createKlineRepo } from './kline.repository';
import { isKlineRepoError } from './kline.repository.error';

const httpClient = createAxiosHttpClient();
const klineRepo = createKlineRepo({ httpClient });

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('UUT: Get klines', () => {
  const { method, url } = API_ENDPOINTS.GET_KLINES;
  const request: GetKlinesRequest = {
    exchange: exchangeNameEnum.BINANCE,
    symbol: 'BTCUSDT' as SymbolName,
    timeframe: timeframeEnum['1d'],
    startTimestamp: new Date('2022-10-01') as ValidDate,
    endTimestamp: new Date('2022-10-02') as ValidDate,
  };

  describe('[WHEN] get klines', () => {
    it('[THEN] it will send a request to server with correct params', async () => {
      let params: URLSearchParams = new URLSearchParams();
      server.use(
        addRestRoute(method, createApiPath(url), (req, res, ctx) => {
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
        server.use(addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(500))));

        const result = await executeT(klineRepo.getKlines(request));

        expect(result).toEqualLeft(expect.toSatisfy(isKlineRepoError));
      });
    });
  });

  describe('[GIVEN] the server return successful response', () => {
    describe('[WHEN] get klines', () => {
      it('[THEN] it will return Right of a list of klines', async () => {
        const klines = generateArrayOf(mockKline, 3);
        server.use(
          addRestRoute(method, createApiPath(url), (_, res, ctx) => res(ctx.status(200), ctx.json(klines))),
        );

        const result = await executeT(klineRepo.getKlines(request));

        expect(result).toEqualRight(klines);
      });
    });
  });
});
