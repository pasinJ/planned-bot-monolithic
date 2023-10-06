import { exchangeNameEnum } from '#features/shared/exchange.js';
import { languageEnum } from '#features/shared/strategy.js';
import { timeframeEnum } from '#features/shared/timeframe.js';

export function mockValidAddBtStrategyRequestBody(
  request?: Partial<{ startTimestamp: Date; endTimestamp: Date }>,
) {
  return {
    name: 'name',
    exchange: exchangeNameEnum.BINANCE,
    symbol: 'BTCUSDT',
    timeframe: timeframeEnum['1h'],
    maxNumKlines: 10,
    initialCapital: 1000,
    capitalCurrency: 'USDT',
    takerFeeRate: 1,
    makerFeeRate: 2,
    startTimestamp: request?.startTimestamp?.toISOString() ?? '2011-12-12T12:00:00.000Z',
    endTimestamp: request?.endTimestamp?.toISOString() ?? '2011-12-12T13:00:00.000Z',
    timezone: '+03:00',
    language: languageEnum.typescript,
    body: 'console.log("Hi")',
  };
}
