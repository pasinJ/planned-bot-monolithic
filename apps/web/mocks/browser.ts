import { generateMock } from '@anatine/zod-mock';
import { rest, setupWorker } from 'msw';

import { API_ENDPOINTS as BACKTEST_API_ENDPOINTS } from '#features/backtesting-strategies/repositories/backtestingStrategy.constant';
import { API_ENDPOINTS } from '#features/portfolios/repositories/portfolioRepository.constant';
import { API_ENDPOINTS as SYMBOL_API_ENDPOINTS } from '#features/symbols/repositories/symbol.constant';
import { API_BASE_URL } from '#infra/httpClient.constant';
import { arrayOf } from '#test-utils/faker';
import { mockBacktestingStrategy } from '#test-utils/mockEntity';
import { mockSymbol } from '#test-utils/mockValueObject';

const { GET_PORTFOLIOS, CREATE_PORTFOLIO } = API_ENDPOINTS;
const { GET_SYMBOLS } = SYMBOL_API_ENDPOINTS;
const { ADD_BT_STRATEGY: CREATE_BACKTESTING_STRATEGY } = BACKTEST_API_ENDPOINTS;

const getPortfoliosUrl = API_BASE_URL + GET_PORTFOLIOS.url;
const mockGetPortfoliosResp = generateMock(GET_PORTFOLIOS.responseSchema);

const createPortfoliosUrl = API_BASE_URL + CREATE_PORTFOLIO.url;
const mockCreatePortfolioResp = generateMock(CREATE_PORTFOLIO.responseSchema);

const getSymbolsUrl = API_BASE_URL + GET_SYMBOLS.url;
const symbols = arrayOf(mockSymbol, 5);

const createBacktestingStrategyUrl = API_BASE_URL + CREATE_BACKTESTING_STRATEGY.url;
const strategy = mockBacktestingStrategy();

let portfolioCreated = false;

export const worker = setupWorker(
  rest.get(getPortfoliosUrl, (_, res, ctx) =>
    res(ctx.status(200), ctx.json(portfolioCreated ? mockGetPortfoliosResp : [])),
  ),
  rest.post(createPortfoliosUrl, (_, res, ctx) => {
    portfolioCreated = true;
    return res(ctx.status(400), ctx.json(mockCreatePortfolioResp));
  }),
  rest.get(getSymbolsUrl, (_, res, ctx) => res(ctx.status(200), ctx.json(symbols))),
  rest.post(createBacktestingStrategyUrl, (_, res, ctx) => res(ctx.status(201), ctx.json(strategy))),
);
