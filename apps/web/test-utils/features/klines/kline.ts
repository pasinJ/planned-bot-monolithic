import { mergeRight } from 'ramda';

import { exchangeNameEnum } from '#features/exchanges/exchange';
import { Kline, NumTrades, Price, Volume, timeframeEnum } from '#features/klines/kline';
import { SymbolName } from '#features/symbols/symbol';
import { Unbrand } from '#shared/common.type';
import { ValidDate } from '#shared/utils/date';

export function mockKline(override?: Partial<Unbrand<Kline>>): Kline {
  return mergeRight<Kline, Partial<Unbrand<Kline>>>(
    {
      exchange: exchangeNameEnum.BINANCE,
      symbol: 'BNBUSDT' as SymbolName,
      timeframe: timeframeEnum['1M'],
      openTimestamp: new Date('2020-05-02') as ValidDate,
      closeTimestamp: new Date('2020-05-03') as ValidDate,
      open: 999.99 as Price,
      high: 999.99 as Price,
      low: 999.99 as Price,
      close: 999.99 as Price,
      volume: 99.99 as Volume,
      quoteAssetVolume: 99.99 as Volume,
      takerBuyBaseAssetVolume: 99.99 as Volume,
      takerBuyQuoteAssetVolume: 99.99 as Volume,
      numTrades: 9999 as NumTrades,
    },
    override ?? {},
  ) as Kline;
}
