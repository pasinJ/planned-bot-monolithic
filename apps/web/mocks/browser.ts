import { rest, setupWorker } from 'msw';

import { API_ENDPOINTS as BACKTEST_API_ENDPOINTS } from '#features/backtesting-strategies/repositories/btStrategy.constant';
import { API_ENDPOINTS as KLINE_API_ENDPOINTS } from '#features/klines/kline.constant';
import { API_ENDPOINTS as SYMBOL_API_ENDPOINTS } from '#features/symbols/symbol.constant';
import { API_BASE_URL } from '#infra/httpClient.constant';
import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { mockKline } from '#test-utils/features/klines/kline';
import { mockSymbol } from '#test-utils/features/symbols/domain';

const { GET_SYMBOLS } = SYMBOL_API_ENDPOINTS;
const { ADD_BT_STRATEGY: CREATE_BACKTESTING_STRATEGY } = BACKTEST_API_ENDPOINTS;

const getSymbolsUrl = API_BASE_URL + GET_SYMBOLS.url;
const symbols = generateArrayOf(mockSymbol, 5);

const getKlinesUrl = API_BASE_URL + KLINE_API_ENDPOINTS.GET_KLINES.url;
const klines = generateArrayOf(mockKline, 5);

const createBacktestingStrategyUrl = API_BASE_URL + CREATE_BACKTESTING_STRATEGY.url;
const strategy = mockBtStrategy();

export const worker = setupWorker(
  rest.get(getSymbolsUrl, (_, res, ctx) => res(ctx.status(200), ctx.json(symbols))),
  rest.get(getKlinesUrl, (_, res, ctx) => res(ctx.status(200), ctx.json(klines))),
  rest.post(createBacktestingStrategyUrl, (_, res, ctx) => res(ctx.status(201), ctx.json(strategy))),
);
