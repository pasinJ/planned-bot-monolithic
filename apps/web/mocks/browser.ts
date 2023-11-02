import { faker } from '@faker-js/faker';
import { rest, setupWorker } from 'msw';

import { API_ENDPOINTS as BACKTEST_API_ENDPOINTS } from '#features/btStrategies/endpoints';
import { API_ENDPOINTS as KLINE_API_ENDPOINTS } from '#features/klines/endpoints';
import { Kline } from '#features/klines/kline';
import { API_ENDPOINTS as SYMBOL_API_ENDPOINTS } from '#features/symbols/endpoints';
import executionResult from '#test-utils/execution-result.json';
import { generateArrayOf } from '#test-utils/faker';
import { mockBtStrategy } from '#test-utils/features/btStrategies/btStrategy';
import { mockSymbol } from '#test-utils/features/symbols/symbol';
import rawKlines from '#test-utils/klines-2.json';
import { createApiPath } from '#test-utils/msw';

const getSymbolsUrl = createApiPath(SYMBOL_API_ENDPOINTS.GET_SYMBOLS.url);
const symbols = [
  ...generateArrayOf(mockSymbol, 5),
  { name: 'BTCUSDT', exchange: 'BINANCE', baseAsset: 'BTC', quoteAsset: 'USDT' },
];

const getKlinesUrl = createApiPath(KLINE_API_ENDPOINTS.GET_KLINES.url);
const klines = rawKlines.map(
  ([
    openTimestamp,
    open,
    high,
    low,
    close,
    volume,
    closeTimestamp,
    quoteAssetVolume,
    numOfTrades,
    takerBuyBaseAssetVolume,
    takerBuyQuoteAssetVolume,
  ]) =>
    ({
      exchange: 'BINANCE',
      symbol: 'BTCUSDT',
      timeframe: '1h',
      openTimestamp: new Date(openTimestamp),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume),
      closeTimestamp: new Date(closeTimestamp),
      quoteAssetVolume: Number(quoteAssetVolume),
      numTrades: Number(numOfTrades),
      takerBuyBaseAssetVolume: Number(takerBuyBaseAssetVolume),
      takerBuyQuoteAssetVolume: Number(takerBuyQuoteAssetVolume),
    }) as Kline,
);

const getBtStrategiesUrl = createApiPath(BACKTEST_API_ENDPOINTS.GET_BT_STRATEGIES.url);
const getBtStrategyUrl = createApiPath(BACKTEST_API_ENDPOINTS.GET_BT_STRATEGY.url).replace(
  ':btStrategyId',
  '*',
);
const addBtStrategyUrl = createApiPath(BACKTEST_API_ENDPOINTS.ADD_BT_STRATEGY.url);
const updateBtStrategyUrl = createApiPath(BACKTEST_API_ENDPOINTS.UPDATE_BT_STRATEGY.url).replace(
  ':btStrategyId',
  '*',
);
const executeBtStrategyUrl = createApiPath(BACKTEST_API_ENDPOINTS.EXECUTE_BT_STRATEGY.url).replace(
  ':btStrategyId',
  '*',
);
const getExecutionProgressUrl = createApiPath(BACKTEST_API_ENDPOINTS.GET_EXECUTION_PROGRESS.url)
  .replace(':btStrategyId', '*')
  .replace(':btExecutionId', '*');
const getLastExecutionProgressUrl = createApiPath(
  BACKTEST_API_ENDPOINTS.GET_LAST_EXECUTION_PROGRESS.url,
).replace(':btStrategyId', '*');
const getExecutionResultUrl = createApiPath(BACKTEST_API_ENDPOINTS.GET_EXECUTION_RESULT.url)
  .replace(':btStrategyId', '*')
  .replace(':btExecutionId', '*');

const DELAY = 0;
let counter = 0;

export const worker = setupWorker(
  rest.get(getSymbolsUrl, (_, res, ctx) => res(ctx.delay(DELAY), ctx.status(200), ctx.json(symbols))),
  rest.get(getKlinesUrl, (_, res, ctx) => res(ctx.delay(DELAY), ctx.status(200), ctx.json(klines))),
  rest.post(addBtStrategyUrl, (_, res, ctx) =>
    res(ctx.delay(DELAY), ctx.status(201), ctx.json({ id: faker.string.nanoid(), createdAt: new Date() })),
  ),
  rest.put(updateBtStrategyUrl, (_, res, ctx) => res(ctx.delay(DELAY), ctx.status(200))),
  rest.post(executeBtStrategyUrl, (_, res, ctx) =>
    res(
      ctx.delay(DELAY),
      ctx.status(202),
      ctx.json({ id: faker.string.nanoid(), createdAt: new Date(), progressPath: '', resultPath: '' }),
    ),
  ),
  rest.get(getExecutionProgressUrl, (_, res, ctx) => {
    const body =
      counter === 0
        ? { status: 'PENDING', percentage: 0, logs: [] }
        : counter === 1
        ? { status: 'RUNNING', percentage: 0, logs: [] }
        : counter === 2
        ? { status: 'RUNNING', percentage: 10, logs: ['log1'] }
        : counter === 3
        ? { status: 'RUNNING', percentage: 20, logs: ['log1', 'log2'] }
        : counter === 4
        ? { status: 'RUNNING', percentage: 50, logs: ['log1', 'log2'] }
        : counter === 5
        ? { status: 'RUNNING', percentage: 100, logs: ['log1', 'log2', 'log3'] }
        : { status: 'FINISHED', percentage: 100, logs: ['log1', 'log2', 'log3'] };

    counter += 1;

    return res(
      ctx.delay(DELAY),
      ctx.status(200),
      ctx.json({
        id: faker.string.nanoid(),
        btStrategyId: faker.string.nanoid(),
        ...body,
      }),
    );
  }),
  rest.get(getLastExecutionProgressUrl, (_, res, ctx) => {
    const body =
      counter === 0
        ? { status: 'PENDING', percentage: 0, logs: [] }
        : counter === 1
        ? { status: 'RUNNING', percentage: 0, logs: [] }
        : counter === 2
        ? { status: 'RUNNING', percentage: 10, logs: ['log1'] }
        : counter === 3
        ? { status: 'RUNNING', percentage: 20, logs: ['log1', 'log2'] }
        : counter === 4
        ? { status: 'RUNNING', percentage: 50, logs: ['log1', 'log2'] }
        : counter === 5
        ? { status: 'RUNNING', percentage: 100, logs: ['log1', 'log2', 'log3'] }
        : { status: 'FINISHED', percentage: 100, logs: ['log1', 'log2', 'log3'] };

    counter += 1;

    return res(
      ctx.delay(DELAY),
      ctx.status(200),
      ctx.json({
        id: faker.string.nanoid(),
        btStrategyId: faker.string.nanoid(),
        ...body,
      }),
    );
  }),
  rest.get(getExecutionResultUrl, (_, res, ctx) =>
    res(ctx.delay(DELAY), ctx.status(200), ctx.json(executionResult)),
  ),
  rest.get(getBtStrategiesUrl, (_, res, ctx) =>
    res(ctx.delay(DELAY), ctx.status(200), ctx.json(generateArrayOf(mockBtStrategy))),
  ),
  rest.get(getBtStrategyUrl, (_, res, ctx) =>
    res(ctx.delay(DELAY), ctx.status(200), ctx.json(mockBtStrategy())),
  ),
);
