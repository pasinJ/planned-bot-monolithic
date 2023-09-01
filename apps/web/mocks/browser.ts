import { rest, setupWorker } from 'msw';

import { API_ENDPOINTS as BACKTEST_API_ENDPOINTS } from '#features/backtesting-strategies/repositories/btStrategy.constant';
import { API_ENDPOINTS as SYMBOL_API_ENDPOINTS } from '#features/symbols/repositories/symbol.constant';
import { API_BASE_URL } from '#infra/httpClient.constant';
import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/backtesting-strategies/entities';
import { mockSymbol } from '#test-utils/features/symbols/valueObjects';

const { GET_SYMBOLS } = SYMBOL_API_ENDPOINTS;
const { ADD_BT_STRATEGY: CREATE_BACKTESTING_STRATEGY } = BACKTEST_API_ENDPOINTS;

const getSymbolsUrl = API_BASE_URL + GET_SYMBOLS.url;
const symbols = generateArrayOf(mockSymbol, 5);

const createBacktestingStrategyUrl = API_BASE_URL + CREATE_BACKTESTING_STRATEGY.url;
const strategy = mockBtStrategy();

export const worker = setupWorker(
  rest.get(getSymbolsUrl, (_, res, ctx) => res(ctx.status(200), ctx.json(symbols))),
  rest.post(createBacktestingStrategyUrl, (_, res, ctx) => res(ctx.status(201), ctx.json(strategy))),
);
